"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pruneOldRequestTraces = exports.monitorDuplicateCategories = exports.snapshotSystemStats = exports.sendScheduledReminders = exports.notifyBookingStatusChange = exports.notifyBookingUpdate = exports.notifyNewBooking = exports.getLocationStats = exports.findNearbyProviders = exports.sendTestNotification = exports.adminDeleteUser = exports.onAuthDeleteUser = exports.dedupeServiceCategories = void 0;
const admin = __importStar(require("firebase-admin"));
const cors_1 = __importDefault(require("cors"));
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const v1_1 = require("firebase-functions/v1");
const params_1 = require("firebase-functions/params");
const corsHandler = (0, cors_1.default)({
    origin: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-trace-id', 'x-client-version', 'x-admin-key'],
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE']
});
// Initialize Firebase Admin - uses default credentials automatically
admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();
// Deployment/version tag for tracing (update per deploy if desired)
const DEPLOYMENT_VERSION = '2025-11-08.1';
// Simple structured trace logger with sampling + optional Firestore persistence.
// Sampling keeps cost low while enabling later analytics (default 5%).
const TRACE_SAMPLING_RATE = 0.05; // 5%
function logTrace(trace, event, extra) {
    if (!trace)
        return;
    const payload = { trace, event, ts: new Date().toISOString(), v: DEPLOYMENT_VERSION, ...(extra || {}) };
    console.log('[TRACE]', JSON.stringify(payload));
    try {
        if (Math.random() < TRACE_SAMPLING_RATE) {
            // Fire-and-forget persistence (no await to avoid latency impact)
            db.collection('request_traces').add(payload).catch(() => { });
        }
    }
    catch { }
}
function syntheticTrace(event) {
    return `${event}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
// Secret to protect the admin HTTP endpoint
const ADMIN_DELETE_TOKEN = (0, params_1.defineSecret)('ADMIN_DELETE_TOKEN');
async function deleteByQuery(col, field, value) {
    const snap = await db.collection(col).where(field, '==', value).get();
    if (snap.empty)
        return;
    const bw = db.bulkWriter();
    snap.docs.forEach((d) => bw.delete(d.ref));
    await bw.close();
}
// Standardized error response helper
function errorResponse(res, status, code, message, trace) {
    const body = { error: { code, message } };
    if (trace)
        body.trace = trace;
    return res.status(status).json(body);
}
async function deleteByServiceIds(col, serviceIds) {
    if (serviceIds.length === 0)
        return;
    const bw = db.bulkWriter();
    for (const id of serviceIds) {
        const snap = await db.collection(col).where('service_id', '==', id).get();
        snap.docs.forEach((d) => bw.delete(d.ref));
    }
    await bw.close();
}
// =============================================================================
// DATA HYGIENE: Deduplicate service_categories
// =============================================================================
// This endpoint finds duplicate categories by a normalized key (Arabic or English title)
// and (in execute mode) merges them by updating all referencing services to point to
// the chosen primary category, then deleting the redundant documents.
// Usage:
//   POST /dedupeServiceCategories?mode=dryRun  (or body { mode: 'dryRun' })
//   POST /dedupeServiceCategories?mode=execute (requires admin secret / auth)
// Authorization: same logic as adminDeleteUser (Bearer admin token OR x-admin-key header matching ADMIN_DELETE_TOKEN)
// Safety:
//  - Hard cap of 25 duplicate groups per invocation
//  - Dry run returns a plan without modifying data
//  - Execute returns detailed summary of operations performed
exports.dedupeServiceCategories = (0, https_1.onRequest)({ maxInstances: 1, secrets: [ADMIN_DELETE_TOKEN] }, (req, res) => {
    corsHandler(req, res, async () => {
        if (req.method !== 'POST')
            return errorResponse(res, 405, 'method_not_allowed', 'POST required', req.get('x-trace-id'));
        const mode = (req.query.mode || req.body?.mode || 'dryRun');
        const trace = req.get('x-trace-id');
        logTrace(trace, 'dedupeServiceCategories:start', { mode });
        // Auth check (only required for execute)
        const ensureAuthorized = async () => {
            if (mode === 'dryRun')
                return true; // allow anonymous dry runs for inspection
            let isAuthorized = false;
            const bearer = (req.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
            if (bearer) {
                try {
                    const decoded = await admin.auth().verifyIdToken(bearer);
                    const email = decoded?.email;
                    const hasAdminClaim = decoded?.admin === true;
                    const emailDomainOk = typeof email === 'string' && /@(tibrcode\.com|servyard\.com|serv-yard\.com)$/i.test(email || '');
                    const specificAdmin = typeof email === 'string' && email.toLowerCase() === 'admin@servyard.com';
                    if (hasAdminClaim || emailDomainOk || specificAdmin)
                        isAuthorized = true;
                }
                catch { }
            }
            if (!isAuthorized) {
                const headerKey = (req.get('x-admin-key') || req.query.key);
                const secretValue = ADMIN_DELETE_TOKEN.value();
                if (!secretValue)
                    return false;
                if (headerKey && headerKey === secretValue)
                    isAuthorized = true;
            }
            return isAuthorized;
        };
        if (!(await ensureAuthorized())) {
            return errorResponse(res, 401, 'unauthorized', 'Not authorized for this operation', trace);
        }
        try {
            const snap = await db.collection('service_categories').get();
            const all = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
            const groups = {};
            function normalize(cat) {
                const ar = (cat.title_ar || cat.name_ar || '').trim().toLowerCase();
                const en = (cat.title_en || cat.name_en || cat.title || cat.name || '').trim().toLowerCase();
                const base = ar || en;
                // remove duplicate whitespace + unify certain punctuation
                return base.replace(/[\s]+/g, ' ').replace(/[ـ]/g, '').trim();
            }
            for (const c of all) {
                const key = normalize(c.data);
                if (!key)
                    continue;
                if (!groups[key])
                    groups[key] = [];
                groups[key].push(c);
            }
            const duplicateGroups = Object.entries(groups).filter(([, arr]) => arr.length > 1);
            duplicateGroups.sort((a, b) => b[1].length - a[1].length); // largest first
            const limitedGroups = duplicateGroups.slice(0, 25); // safety cap
            if (mode === 'dryRun') {
                const started = Date.now();
                const payload = {
                    mode,
                    totalCategories: all.length,
                    duplicateGroupCount: duplicateGroups.length,
                    processedGroups: limitedGroups.length,
                    groups: limitedGroups.map(([key, arr]) => ({
                        key,
                        count: arr.length,
                        ids: arr.map((x) => x.id),
                        sample: arr[0].data,
                    })),
                    note: 'Execute will re-point services.category_id to primary and delete other category docs.'
                };
                logTrace(trace, 'dedupeServiceCategories:done', { mode, duration_ms: Date.now() - started, groups: limitedGroups.length, dryRun: true });
                return res.json(payload);
            }
            // EXECUTE MODE
            const results = [];
            let totalServiceUpdates = 0;
            let totalCategoryDeletes = 0;
            for (const [key, arr] of limitedGroups) {
                // Choose primary: earliest created_at, else lexicographic id
                const withMeta = arr.map((x) => ({
                    id: x.id,
                    created: x.data.created_at ? new Date(x.data.created_at) : null,
                    data: x.data,
                }));
                withMeta.sort((a, b) => {
                    if (a.created && b.created)
                        return a.created.getTime() - b.created.getTime();
                    if (a.created && !b.created)
                        return -1;
                    if (!a.created && b.created)
                        return 1;
                    return a.id.localeCompare(b.id);
                });
                const primary = withMeta[0];
                const duplicates = withMeta.slice(1);
                const duplicateIds = duplicates.map((d) => d.id);
                // Update referencing services
                const bw = db.bulkWriter();
                for (const dupId of duplicateIds) {
                    const svcSnap = await db.collection('services').where('category_id', '==', dupId).get();
                    for (const doc of svcSnap.docs) {
                        bw.update(doc.ref, { category_id: primary.id });
                        totalServiceUpdates++;
                    }
                }
                await bw.close();
                // Delete duplicate category docs
                const bw2 = db.bulkWriter();
                for (const dupId of duplicateIds) {
                    bw2.delete(db.collection('service_categories').doc(dupId));
                    totalCategoryDeletes++;
                }
                await bw2.close();
                results.push({
                    key,
                    primary: primary.id,
                    removed: duplicateIds,
                    serviceUpdates: totalServiceUpdates,
                });
            }
            const _started = Date.now();
            const response = {
                mode,
                processedGroups: limitedGroups.length,
                totalServiceUpdates,
                totalCategoryDeletes,
                details: results,
            };
            logTrace(trace, 'dedupeServiceCategories:done', { mode, duration_ms: Date.now() - _started, groups: limitedGroups.length });
            return res.json(response);
        }
        catch (e) {
            console.error('Error in dedupeServiceCategories:', e);
            return errorResponse(res, 500, 'internal_error', e?.message || 'Internal server error', trace);
        }
    });
});
async function deleteUserData(uid) {
    // Try to read role
    let role = null;
    try {
        const profileSnap = await db.collection('profiles').doc(uid).get();
        if (profileSnap.exists) {
            role = profileSnap.data()?.user_type || null;
        }
    }
    catch { }
    if (role === 'provider') {
        const servicesSnap = await db.collection('services').where('provider_id', '==', uid).get();
        const serviceIds = servicesSnap.docs.map((d) => d.id);
        await deleteByServiceIds('service_availability', serviceIds);
        await deleteByServiceIds('service_special_dates', serviceIds);
        await deleteByQuery('reviews', 'provider_id', uid);
        await deleteByQuery('offers', 'provider_id', uid);
        await deleteByQuery('bookings', 'provider_id', uid);
        if (!servicesSnap.empty) {
            const bw = db.bulkWriter();
            servicesSnap.docs.forEach((d) => bw.delete(d.ref));
            await bw.close();
        }
    }
    // Customer side
    await deleteByQuery('bookings', 'customer_id', uid);
    await deleteByQuery('reviews', 'customer_id', uid);
    // Profile last
    await db.collection('profiles').doc(uid).delete().catch(() => { });
}
// 1) Trigger: when a user is deleted from Firebase Authentication (e.g., from the Console)
exports.onAuthDeleteUser = v1_1.auth.user().onDelete(async (userRecord) => {
    const uid = userRecord.uid;
    await deleteUserData(uid);
});
// 2) Admin HTTP endpoint: POST /adminDeleteUser with header x-admin-key and body { uid }
exports.adminDeleteUser = (0, https_1.onRequest)({ maxInstances: 1, secrets: [ADMIN_DELETE_TOKEN] }, (req, res) => {
    corsHandler(req, res, async () => {
        if (req.method !== 'POST')
            return errorResponse(res, 405, 'method_not_allowed', 'POST required', req.get('x-trace-id'));
        const trace = req.get('x-trace-id');
        const started = Date.now();
        logTrace(trace, 'adminDeleteUser:start');
        // AuthN: either Bearer ID token with admin rights OR x-admin-key secret
        const bearer = (req.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
        const headerKey = (req.get('x-admin-key') || req.query.key);
        const secretValue = ADMIN_DELETE_TOKEN.value();
        let isAuthorized = false;
        if (bearer) {
            try {
                const decoded = await admin.auth().verifyIdToken(bearer);
                const email = decoded?.email;
                const hasAdminClaim = decoded?.admin === true;
                const emailDomainOk = typeof email === 'string' && /@(tibrcode\.com|servyard\.com|serv-yard\.com)$/i.test(email || '');
                const specificAdmin = typeof email === 'string' && email.toLowerCase() === 'admin@servyard.com';
                if (hasAdminClaim || emailDomainOk || specificAdmin) {
                    isAuthorized = true;
                }
            }
            catch { }
        }
        if (!isAuthorized) {
            if (!secretValue)
                return errorResponse(res, 500, 'server_not_configured', 'Server not configured', trace);
            if (!headerKey || headerKey !== secretValue)
                return errorResponse(res, 401, 'unauthorized', 'Unauthorized', trace);
            isAuthorized = true;
        }
        // Accept uid or email
        let uid = (req.body?.uid || req.query.uid);
        const emailParam = (req.body?.email || req.query.email);
        try {
            if (!uid && emailParam) {
                const userRecord = await admin.auth().getUserByEmail(emailParam);
                uid = userRecord.uid;
            }
        }
        catch (e) {
            return errorResponse(res, 404, 'user_not_found', 'User not found for email', trace);
        }
        if (!uid)
            return errorResponse(res, 400, 'missing_parameters', 'Missing uid or email', trace);
        // Try to delete Auth user first (ignore if not found)
        try {
            await admin.auth().deleteUser(uid);
        }
        catch (e) {
            if (e?.code !== 'auth/user-not-found')
                throw e;
        }
        try {
            await deleteUserData(uid);
            logTrace(trace, 'adminDeleteUser:done', { duration_ms: Date.now() - started });
            return res.json({ ok: true });
        }
        catch (e) {
            logTrace(trace, 'adminDeleteUser:error', { duration_ms: Date.now() - started, message: e?.message });
            return errorResponse(res, 500, 'delete_failed', 'Failed to delete user data', trace);
        }
    });
});
// OLD FUNCTIONS - TEMPORARILY DISABLED DUE TO REGION MISMATCH
// These are replaced by the new notification system below
/*
// 3) إرسال إشعار عند إنشاء حجز جديد
export const sendBookingNotification = onDocumentCreated(
  'bookings/{bookingId}',
  async (event) => {
    const booking = event.data?.data();
    if (!booking) return;

    try {
      // جلب بيانات المزود
      const providerDoc = await db.collection('profiles').doc(booking.provider_id).get();
      const providerData = providerDoc.data();
      
      if (!providerData?.fcm_token || !providerData?.notifications_enabled) {
        console.log('Provider notifications disabled or no token');
        return;
      }

      // جلب بيانات الخدمة
      const serviceDoc = await db.collection('services').doc(booking.service_id).get();
      const serviceName = serviceDoc.data()?.name || 'خدمة';

      // إرسال الإشعار
      await messaging.send({
        token: providerData.fcm_token,
        notification: {
          title: '🔔 حجز جديد',
          body: `لديك حجز جديد لخدمة ${serviceName} في ${booking.booking_date}`
        },
        data: {
          type: 'new_booking',
          booking_id: event.params.bookingId,
          url: '/provider-dashboard'
        }
      });

      console.log('Booking notification sent');
    } catch (error) {
      console.error('Error sending booking notification:', error);
    }
  }
);

// 4) إرسال إشعار عند تأكيد الحجز
export const sendBookingConfirmationNotification = onDocumentUpdated(
  'bookings/{bookingId}',
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    
    if (!before || !after) return;
    
    // تحقق من تغيير الحالة إلى confirmed
    if (before.status !== 'confirmed' && after.status === 'confirmed') {
      try {
        // جلب بيانات العميل
        const customerDoc = await db.collection('profiles').doc(after.customer_id).get();
        const customerData = customerDoc.data();
        
        if (!customerData?.fcm_token || !customerData?.notifications_enabled) {
          return;
        }

        // إرسال الإشعار
        await messaging.send({
          token: customerData.fcm_token,
          notification: {
            title: '✅ تم تأكيد الحجز',
            body: `تم تأكيد حجزك في ${after.booking_date}`
          },
          data: {
            type: 'booking_confirmed',
            booking_id: event.params.bookingId,
            url: '/customer-dashboard'
          }
        });
      } catch (error) {
        console.error('Error sending confirmation notification:', error);
      }
    }
    
    // إشعار عند اكتمال الخدمة
    if (before.status !== 'completed' && after.status === 'completed') {
      try {
        const customerDoc = await db.collection('profiles').doc(after.customer_id).get();
        const customerData = customerDoc.data();
        
        if (customerData?.fcm_token && customerData?.notifications_enabled) {
          await messaging.send({
            token: customerData.fcm_token,
            notification: {
              title: '⭐ قيّم الخدمة',
              body: 'تم إكمال الخدمة! شاركنا تجربتك'
            },
            data: {
              type: 'booking_completed',
              booking_id: event.params.bookingId,
              url: '/customer-dashboard'
            }
          });
        }
      } catch (error) {
        console.error('Error sending completion notification:', error);
      }
    }
  }
);

// 5) إرسال إشعار عند إضافة تقييم جديد
export const sendReviewNotification = onDocumentCreated(
  'reviews/{reviewId}',
  async (event) => {
    const review = event.data?.data();
    if (!review) return;

    try {
      // جلب بيانات المزود
      const providerDoc = await db.collection('profiles').doc(review.provider_id).get();
      const providerData = providerDoc.data();
      
      if (!providerData?.fcm_token || !providerData?.notifications_enabled) {
        return;
      }

      // إرسال الإشعار
      const stars = '⭐'.repeat(review.rating);
      await messaging.send({
        token: providerData.fcm_token,
        notification: {
          title: '⭐ تقييم جديد',
          body: `حصلت على تقييم ${stars} (${review.rating}/5)`
        },
        data: {
          type: 'new_review',
          review_id: event.params.reviewId,
          url: '/provider-dashboard'
        }
      });
    } catch (error) {
      console.error('Error sending review notification:', error);
    }
  }
);
*/
// END OF OLD FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════
// 🌍 Cloud Functions للبحث الجغرافي
// Geographic Search Cloud Functions
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Simple test push endpoint
 * Body: { userId?: string, token?: string, title?: string, body?: string }
 */
exports.sendTestNotification = (0, https_1.onRequest)({ cors: true, invoker: 'public' }, async (req, res) => {
    if (req.method !== 'POST') {
        return errorResponse(res, 405, 'method_not_allowed', 'POST required', req.get('x-trace-id'));
    }
    try {
        const trace = req.get('x-trace-id');
        const started = Date.now();
        logTrace(trace, 'sendTestNotification:start');
        const { userId, token, title, body } = req.body || {};
        console.log('[sendTestNotification] Raw request body:', JSON.stringify(req.body));
        console.log('[sendTestNotification] userId value:', userId);
        console.log('[sendTestNotification] userId type:', typeof userId);
        console.log('[sendTestNotification] userId length:', userId?.length);
        if (userId) {
            console.log('[sendTestNotification] userId chars:', userId.split('').map((c, i) => `${i}:${c}(${c.charCodeAt(0)})`).join(', '));
        }
        console.log('[sendTestNotification] Request body:', { userId: userId ? 'present' : 'missing', hasToken: !!token });
        let targetToken = token || null;
        if (!targetToken && userId) {
            console.log('[sendTestNotification] Looking up token for userId:', userId);
            targetToken = await getUserFCMToken(userId);
            console.log('[sendTestNotification] Token lookup result:', targetToken ? 'found' : 'not found');
        }
        if (!targetToken) {
            console.error('[sendTestNotification] No token available. userId:', userId, 'token provided:', !!token);
            return errorResponse(res, 400, 'missing_token', 'Missing token and userId or no token found', trace);
        }
        try {
            const ok = await sendNotification(targetToken, title || '🔔 Test Notification', body || 'Hello from ServYard test endpoint', { type: 'test', link: '/' });
            logTrace(trace, 'sendTestNotification:done', { duration_ms: Date.now() - started, success: ok });
            return res.json({ success: ok });
        }
        catch (sendError) {
            console.error('[sendTestNotification] FCM send error:', sendError);
            logTrace(trace, 'sendTestNotification:fcm_error', { error: sendError?.message, code: sendError?.code });
            return res.json({
                success: false,
                error: sendError?.message || 'Unknown FCM error',
                code: sendError?.errorInfo?.code || sendError?.code || 'unknown'
            });
        }
    }
    catch (e) {
        console.error('Error in sendTestNotification:', e);
        const trace = req.get('x-trace-id');
        logTrace(trace, 'sendTestNotification:error', { message: e?.message });
        return errorResponse(res, 500, 'internal_error', 'Internal server error', trace);
    }
});
/**
 * حساب المسافة بين نقطتين باستخدام Haversine formula
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(point1, point2) {
    // Support both formats: {latitude, longitude} and {lat, lon}
    const lat1 = 'latitude' in point1 ? point1.latitude : point1.lat;
    const lon1 = 'longitude' in point1 ? point1.longitude : point1.lon;
    const lat2 = 'latitude' in point2 ? point2.latitude : point2.lat;
    const lon2 = 'longitude' in point2 ? point2.longitude : point2.lon;
    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}
/**
 * البحث عن المزودين القريبين
 * Find nearby providers within radius
 *
 * استخدام:
 * POST /findNearbyProviders
 * Body: {
 *   latitude: 31.9454,
 *   longitude: 35.9284,
 *   radiusKm: 25,
 *   categoryId?: 'category_id', // اختياري
 *   limit?: 50 // اختياري (افتراضي 50)
 * }
 */
exports.findNearbyProviders = (0, https_1.onRequest)({ cors: true }, async (req, res) => {
    try {
        // التحقق من البيانات المطلوبة
        const { latitude, longitude, radiusKm = 25, categoryId, limit = 50 } = req.body;
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            res.status(400).json({
                error: 'Invalid latitude or longitude'
            });
            return;
        }
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            res.status(400).json({
                error: 'Latitude/longitude out of range'
            });
            return;
        }
        // حساب bounding box للبحث السريع
        const latDelta = radiusKm / 111; // تقريباً 111 كم لكل درجة
        const lonDelta = radiusKm / (111 * Math.cos(toRadians(latitude)));
        const minLat = latitude - latDelta;
        const maxLat = latitude + latDelta;
        const minLon = longitude - lonDelta;
        const maxLon = longitude + lonDelta;
        // جلب المزودين ضمن bounding box
        const query = db.collection('profiles')
            .where('user_type', '==', 'provider')
            .where('latitude', '>=', minLat)
            .where('latitude', '<=', maxLat);
        const snapshot = await query.get();
        // فلترة النتائج حسب المسافة الدقيقة
        const providers = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            // التحقق من وجود الإحداثيات
            if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
                return;
            }
            // التحقق من longitude ضمن النطاق
            if (data.longitude < minLon || data.longitude > maxLon) {
                return;
            }
            // حساب المسافة الدقيقة
            const distance = calculateDistance({ latitude, longitude }, { latitude: data.latitude, longitude: data.longitude });
            // فلترة حسب النطاق
            if (distance <= radiusKm) {
                providers.push({
                    id: doc.id,
                    full_name: data.full_name,
                    city: data.city,
                    country: data.country,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    profile_description: data.profile_description,
                    distance: Math.round(distance * 100) / 100, // تقريب إلى منزلتين
                });
            }
        });
        // إذا كان هناك فلتر للفئة، جلب الخدمات
        if (categoryId) {
            const servicesSnapshot = await db.collection('services')
                .where('category_id', '==', categoryId)
                .where('is_active', '==', true)
                .get();
            const providerIds = new Set(servicesSnapshot.docs.map(doc => doc.data().provider_id));
            // فلترة المزودين حسب الفئة
            const filtered = providers.filter(p => providerIds.has(p.id));
            // ترتيب حسب المسافة
            filtered.sort((a, b) => a.distance - b.distance);
            res.json({
                success: true,
                count: filtered.length,
                providers: filtered.slice(0, limit),
                filters: {
                    latitude,
                    longitude,
                    radiusKm,
                    categoryId,
                    limit
                }
            });
            return;
        }
        // ترتيب حسب المسافة
        providers.sort((a, b) => a.distance - b.distance);
        res.json({
            success: true,
            count: providers.length,
            providers: providers.slice(0, limit),
            filters: {
                latitude,
                longitude,
                radiusKm,
                limit
            }
        });
        return;
    }
    catch (error) {
        console.error('Error in findNearbyProviders:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
        return;
    }
});
/**
 * الحصول على إحصائيات المزودين حسب المنطقة
 * Get provider statistics by region
 */
exports.getLocationStats = (0, https_1.onRequest)({ cors: true }, async (req, res) => {
    try {
        const snapshot = await db.collection('profiles')
            .where('user_type', '==', 'provider')
            .get();
        const stats = {};
        snapshot.forEach((doc) => {
            const data = doc.data();
            const country = data.country || 'Unknown';
            const city = data.city || 'Unknown';
            const region = `${country} - ${city}`;
            if (!stats[region]) {
                stats[region] = { count: 0, providers: [] };
            }
            stats[region].count++;
            stats[region].providers.push(doc.id);
        });
        // ترتيب حسب الأكثر
        const sorted = Object.entries(stats)
            .sort(([, a], [, b]) => b.count - a.count)
            .map(([region, data]) => ({
            region,
            count: data.count,
            // لا نرسل IDs للعملاء، فقط الإحصائيات
        }));
        res.json({
            success: true,
            totalRegions: sorted.length,
            totalProviders: snapshot.size,
            regions: sorted
        });
        return;
    }
    catch (error) {
        console.error('Error in getLocationStats:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
        return;
    }
});
// =============================================================================
// NOTIFICATION SYSTEM - نظام التنبيهات
// =============================================================================
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔔 NOTIFICATION SYSTEM - Helper Functions
 * ═══════════════════════════════════════════════════════════════════════════
 */
/**
 * Send FCM notification to a user
 */
async function sendNotification(fcmToken, title, body, data) {
    console.log('[sendNotification] Attempting to send notification');
    console.log('[sendNotification] Token preview:', fcmToken?.substring(0, 30) + '...');
    console.log('[sendNotification] Title:', title);
    console.log('[sendNotification] Body:', body);
    const message = {
        token: fcmToken,
        notification: { title, body },
        data: data || {},
        webpush: {
            fcmOptions: {
                link: data?.link || '/',
            },
        },
    };
    console.log('[sendNotification] Message prepared:', JSON.stringify({ ...message, token: message.token?.substring(0, 30) + '...' }));
    // Let the error bubble up to the caller
    const result = await messaging.send(message);
    console.log('[sendNotification] ✅ Success! Message ID:', result);
    return true;
}
/**
 * Get user's FCM token from profile
 */
async function getUserFCMToken(userId) {
    try {
        console.log('[getUserFCMToken] Looking up token for userId:', userId);
        const profile = await db.collection('profiles').doc(userId).get();
        const data = profile.data();
        const token = data?.fcm_token || null;
        console.log('[getUserFCMToken] Profile exists:', profile.exists);
        console.log('[getUserFCMToken] Has fcm_token:', !!token);
        if (token) {
            console.log('[getUserFCMToken] Token preview:', token.substring(0, 20) + '...');
        }
        else {
            console.log('[getUserFCMToken] Profile data keys:', Object.keys(data || {}));
        }
        return token;
    }
    catch (error) {
        console.error('[getUserFCMToken] Error getting FCM token:', error);
        return null;
    }
}
/**
 * Create reminder entries for a confirmed booking
 * This is used by the scheduled reminders system
 */
async function createBookingReminders(bookingId, booking) {
    try {
        // Get customer's notification preferences
        const customerDoc = await db.collection('profiles').doc(booking.customer_id).get();
        const prefs = customerDoc.data()?.notification_settings || {};
        const enabled = prefs.enabled !== false; // default true
        const remindersCfg = prefs.booking_reminders || {};
        const remindersEnabled = remindersCfg.enabled !== false; // default true
        const times = Array.isArray(remindersCfg.reminder_times) ? remindersCfg.reminder_times : [60];
        if (!enabled || !remindersEnabled || times.length === 0) {
            console.log('⏭️ Reminders disabled by user preferences');
            return;
        }
        const bookingDate = new Date(booking.booking_date);
        const reminders = [];
        // Create reminder documents for each preferred time
        for (const minutesBefore of times) {
            const reminderTime = new Date(bookingDate.getTime() - minutesBefore * 60000);
            reminders.push({
                booking_id: bookingId,
                customer_id: booking.customer_id,
                provider_id: booking.provider_id,
                service_id: booking.service_id,
                reminder_time: reminderTime,
                minutes_before: minutesBefore,
                sent: false,
                created_at: new Date(),
            });
        }
        // Batch write all reminders
        const batch = db.batch();
        reminders.forEach((reminder) => {
            const ref = db.collection('booking_reminders').doc();
            batch.set(ref, reminder);
        });
        await batch.commit();
        console.log(`✅ Created ${reminders.length} reminders for booking ${bookingId}`);
    }
    catch (error) {
        console.error('Error creating reminders:', error);
    }
}
/**
 * HTTP Function: Send notification when booking is created
 * Call this from frontend after creating booking
 */
exports.notifyNewBooking = (0, https_1.onRequest)({ cors: true, invoker: 'public' }, async (req, res) => {
    if (req.method !== 'POST') {
        return errorResponse(res, 405, 'method_not_allowed', 'POST required', req.get('x-trace-id'));
    }
    try {
        const trace = req.get('x-trace-id');
        const started = Date.now();
        logTrace(trace, 'notifyNewBooking:start');
        const { bookingId, booking } = req.body;
        if (!bookingId || !booking) {
            return errorResponse(res, 400, 'missing_parameters', 'Missing bookingId or booking data', trace);
        }
        // Get provider's FCM token
        const providerToken = await getUserFCMToken(booking.provider_id);
        // Check provider notification prefs (if exist)
        const providerProfile = await db.collection('profiles').doc(booking.provider_id).get();
        const providerPrefs = providerProfile.data()?.notification_settings || {};
        const providerEnabled = providerPrefs.enabled !== false;
        if (!providerToken) {
            console.log('Provider FCM token not found');
            return errorResponse(res, 200, 'no_provider_token', 'No FCM token for provider', trace);
        }
        if (!providerEnabled) {
            console.log('Provider notifications disabled by preferences');
            return errorResponse(res, 200, 'provider_notifications_disabled', 'Provider notifications disabled', trace);
        }
        // Get customer name
        const customerDoc = await db.collection('profiles').doc(booking.customer_id).get();
        const customerName = customerDoc.data()?.display_name || customerDoc.data()?.full_name || 'عميل جديد';
        // Get service name
        const serviceDoc = await db.collection('services').doc(booking.service_id).get();
        const serviceName = serviceDoc.data()?.title || 'خدمة';
        // Send notification to provider
        try {
            await sendNotification(providerToken, '🔔 حجز جديد!', `${customerName} طلب حجز ${serviceName}`, {
                type: 'new_booking',
                booking_id: bookingId,
                link: `/provider-dashboard?bookingId=${bookingId}`,
            });
            console.log('✅ New booking notification sent to provider');
        }
        catch (fcmError) {
            console.error('❌ Failed to send FCM notification:', fcmError.message);
            // Continue execution even if notification fails
        }
        logTrace(trace, 'notifyNewBooking:done', { duration_ms: Date.now() - started });
        return res.status(200).json({ success: true });
    }
    catch (error) {
        console.error('Error in notifyNewBooking:', error);
        const trace = req.get('x-trace-id');
        logTrace(trace, 'notifyNewBooking:error', { message: error?.message });
        return errorResponse(res, 500, 'internal_error', 'Internal server error', trace);
    }
});
/**
 * HTTP Function: Send notification when booking is updated (time/date changed)
 * Call this from frontend after updating booking details
 */
exports.notifyBookingUpdate = (0, https_1.onRequest)({ cors: true, invoker: 'public' }, async (req, res) => {
    if (req.method !== 'POST') {
        return errorResponse(res, 405, 'method_not_allowed', 'POST required', req.get('x-trace-id'));
    }
    try {
        const trace = req.get('x-trace-id');
        const started = Date.now();
        logTrace(trace, 'notifyBookingUpdate:start');
        const { bookingId, booking, oldBooking, updates } = req.body;
        if (!bookingId || !booking || !oldBooking) {
            logTrace(trace, 'notifyBookingUpdate:skip', { reason: 'missing_data' });
            return errorResponse(res, 400, 'missing_parameters', 'Missing required data', trace);
        }
        // Get provider's FCM token
        const providerToken = await getUserFCMToken(booking.provider_id);
        const providerProfile = await db.collection('profiles').doc(booking.provider_id).get();
        const prefs = providerProfile.data()?.notification_settings || {};
        const enabled = prefs.enabled !== false;
        if (!enabled) {
            logTrace(trace, 'notifyBookingUpdate:skip', { reason: 'user_prefs_disabled' });
            return errorResponse(res, 200, 'user_prefs_disabled', 'Notifications disabled by user preferences', trace);
        }
        if (!providerToken) {
            console.log('Provider FCM token not found');
            logTrace(trace, 'notifyBookingUpdate:skip', { reason: 'no_provider_token' });
            return errorResponse(res, 200, 'no_provider_token', 'No FCM token for provider', trace);
        }
        // Get service name
        const serviceDoc = await db.collection('services').doc(booking.service_id).get();
        const serviceName = serviceDoc.data()?.title || 'الخدمة';
        // Get customer name
        const customerName = booking.customer_name || 'العميل';
        // Build update message
        const changes = [];
        if (updates.booking_date && updates.booking_date !== oldBooking.booking_date) {
            changes.push(`التاريخ: ${updates.booking_date}`);
        }
        if (updates.start_time && updates.start_time !== oldBooking.start_time) {
            changes.push(`الوقت: ${updates.start_time}`);
        }
        if (updates.end_time && updates.end_time !== oldBooking.end_time) {
            changes.push(`وقت الانتهاء: ${updates.end_time}`);
        }
        const title = '📝 تم تعديل حجز';
        const body = `قام ${customerName} بتعديل حجز ${serviceName}${changes.length > 0 ? ': ' + changes.join(', ') : ''}`;
        try {
            await sendNotification(providerToken, title, body, {
                type: 'booking_updated',
                booking_id: bookingId,
                link: `/provider-dashboard?bookingId=${bookingId}`,
            });
            console.log(`✅ Booking update notification sent to provider`);
        }
        catch (fcmError) {
            console.error('❌ Failed to send FCM notification:', fcmError.message);
        }
        logTrace(trace, 'notifyBookingUpdate:done', { duration_ms: Date.now() - started });
        return res.status(200).json({ success: true });
    }
    catch (error) {
        console.error('Error in notifyBookingUpdate:', error);
        const trace = req.get('x-trace-id');
        logTrace(trace, 'notifyBookingUpdate:error', { message: error?.message });
        return errorResponse(res, 500, 'internal_error', 'Internal server error', trace);
    }
});
/**
 * HTTP Function: Send notification when booking status changes
 * Call this from frontend after updating booking status
 */
exports.notifyBookingStatusChange = (0, https_1.onRequest)({ cors: true, invoker: 'public' }, async (req, res) => {
    if (req.method !== 'POST') {
        return errorResponse(res, 405, 'method_not_allowed', 'POST required', req.get('x-trace-id'));
    }
    try {
        const trace = req.get('x-trace-id');
        const started = Date.now();
        logTrace(trace, 'notifyBookingStatusChange:start');
        const { bookingId, booking, oldStatus, newStatus } = req.body;
        if (!bookingId || !booking || !newStatus) {
            logTrace(trace, 'notifyBookingStatusChange:skip', { reason: 'missing_data' });
            return errorResponse(res, 400, 'missing_parameters', 'Missing bookingId, booking or newStatus', trace);
        }
        // Skip if status didn't change
        if (oldStatus === newStatus) {
            logTrace(trace, 'notifyBookingStatusChange:skip', { reason: 'unchanged' });
            return errorResponse(res, 200, 'unchanged_status', 'Status unchanged', trace);
        }
        // Get customer's FCM token
        const customerToken = await getUserFCMToken(booking.customer_id);
        const customerProfile = await db.collection('profiles').doc(booking.customer_id).get();
        const prefs = customerProfile.data()?.notification_settings || {};
        const enabled = prefs.enabled !== false;
        const updates = prefs.booking_updates || {};
        const quiet = prefs.quiet_hours || {};
        if (!enabled) {
            logTrace(trace, 'notifyBookingStatusChange:skip', { reason: 'user_prefs_disabled' });
            return errorResponse(res, 200, 'user_prefs_disabled', 'Notifications disabled by user preferences', trace);
        }
        if (!customerToken) {
            console.log('Customer FCM token not found');
            logTrace(trace, 'notifyBookingStatusChange:skip', { reason: 'no_customer_token' });
            return errorResponse(res, 200, 'no_customer_token', 'No FCM token for customer', trace);
        }
        // Get service name
        const serviceDoc = await db.collection('services').doc(booking.service_id).get();
        const serviceName = serviceDoc.data()?.title || 'الخدمة';
        // Get provider name
        const providerDoc = await db.collection('profiles').doc(booking.provider_id).get();
        const providerName = providerDoc.data()?.display_name || providerDoc.data()?.full_name || 'المزود';
        let title = '';
        let body = '';
        let notificationType = '';
        switch (newStatus) {
            case 'confirmed':
                title = '✅ تم تأكيد حجزك!';
                body = `تم تأكيد حجزك لـ ${serviceName} مع ${providerName}`;
                notificationType = 'booking_confirmed';
                // Create reminders when booking is confirmed
                await createBookingReminders(bookingId, booking);
                if (updates.confirmations === false) {
                    logTrace(trace, 'notifyBookingStatusChange:skip', { reason: 'confirmations_pref_off' });
                    return errorResponse(res, 200, 'confirmations_pref_off', 'Confirmations disabled by preferences', trace);
                }
                break;
            case 'cancelled':
                title = '❌ تم إلغاء الحجز';
                body = `تم إلغاء حجزك لـ ${serviceName}`;
                notificationType = 'booking_cancelled';
                if (updates.cancellations === false) {
                    logTrace(trace, 'notifyBookingStatusChange:skip', { reason: 'cancellations_pref_off' });
                    return errorResponse(res, 200, 'cancellations_pref_off', 'Cancellations disabled by preferences', trace);
                }
                break;
            case 'completed':
                title = '🎉 تم إكمال الخدمة!';
                body = `شكراً لاستخدامك ${serviceName}. يرجى تقييم الخدمة مع ${providerName}`;
                notificationType = 'booking_completed';
                if (updates.completions === false) {
                    logTrace(trace, 'notifyBookingStatusChange:skip', { reason: 'completions_pref_off' });
                    return errorResponse(res, 200, 'completions_pref_off', 'Completions disabled by preferences', trace);
                }
                break;
            case 'no_show':
                title = '⚠️ لم تحضر للموعد';
                body = `لم تحضر لموعدك مع ${providerName}`;
                notificationType = 'booking_no_show';
                break;
            default:
                logTrace(trace, 'notifyBookingStatusChange:skip', { reason: 'no_notification_for_status' });
                return errorResponse(res, 200, 'no_notification_for_status', 'No notification for this status', trace);
        }
        // Respect quiet hours if configured (using provider's timezone)
        if (quiet.enabled) {
            // Get provider timezone from database (already fetched above as providerDoc)
            const providerData = providerDoc.data();
            const providerTimezone = providerData?.timezone || 'Asia/Dubai';
            const currentHM = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: providerTimezone });
            const [ch, cm] = currentHM.split(':').map(Number);
            const nowMin = ch * 60 + cm;
            const parseHM = (s) => {
                const [h, m] = (s || '00:00').split(':').map((n) => parseInt(n, 10) || 0);
                return h * 60 + m;
            };
            const start = parseHM(quiet.start || '22:00');
            const end = parseHM(quiet.end || '08:00');
            const inQuiet = start <= end ? (nowMin >= start && nowMin < end) : (nowMin >= start || nowMin < end);
            if (inQuiet) {
                logTrace(trace, 'notifyBookingStatusChange:skip', { reason: 'quiet_hours' });
                return errorResponse(res, 200, 'quiet_hours', 'Suppressed due to quiet hours', trace);
            }
        }
        try {
            await sendNotification(customerToken, title, body, {
                type: notificationType,
                booking_id: bookingId,
                link: `/customer-dashboard?bookingId=${bookingId}`,
            });
            console.log(`✅ Booking ${newStatus} notification sent to customer`);
        }
        catch (fcmError) {
            console.error('❌ Failed to send FCM notification:', fcmError.message);
            // Continue execution even if notification fails
        }
        logTrace(trace, 'notifyBookingStatusChange:done', { duration_ms: Date.now() - started, status: newStatus });
        return res.status(200).json({ success: true });
    }
    catch (error) {
        console.error('Error in notifyBookingStatusChange:', error);
        const trace = req.get('x-trace-id');
        logTrace(trace, 'notifyBookingStatusChange:error', { message: error?.message });
        return errorResponse(res, 500, 'internal_error', 'Internal server error', trace);
    }
});
/**
 * Scheduled function: Runs every 5 minutes to send pending reminders
 */
exports.sendScheduledReminders = (0, scheduler_1.onSchedule)({
    schedule: 'every 5 minutes',
    timeZone: 'Asia/Dubai', // UAE timezone
}, async (event) => {
    try {
        const now = new Date();
        const fiveMinutesLater = new Date(now.getTime() + 5 * 60000);
        console.log(`🔍 Checking for reminders between ${now.toISOString()} and ${fiveMinutesLater.toISOString()}`);
        // Get reminders that need to be sent in the next 5 minutes
        const remindersSnapshot = await db
            .collection('booking_reminders')
            .where('sent', '==', false)
            .where('reminder_time', '<=', fiveMinutesLater)
            .get();
        if (remindersSnapshot.empty) {
            console.log('No pending reminders');
            return;
        }
        console.log(`📬 Found ${remindersSnapshot.size} reminders to send`);
        const batch = db.batch();
        let sentCount = 0;
        for (const reminderDoc of remindersSnapshot.docs) {
            const reminder = reminderDoc.data();
            try {
                // Get booking details
                const bookingDoc = await db.collection('bookings').doc(reminder.booking_id).get();
                if (!bookingDoc.exists) {
                    // Booking deleted, mark reminder as sent
                    batch.update(reminderDoc.ref, { sent: true });
                    continue;
                }
                const booking = bookingDoc.data();
                // Skip if booking is cancelled or completed
                if (booking?.status === 'cancelled' || booking?.status === 'completed') {
                    batch.update(reminderDoc.ref, { sent: true });
                    continue;
                }
                // Get customer's FCM token and prefs
                const customerToken = await getUserFCMToken(reminder.customer_id);
                if (!customerToken) {
                    console.log(`No FCM token for customer ${reminder.customer_id}`);
                    batch.update(reminderDoc.ref, { sent: true });
                    continue;
                }
                const customerProfile2 = await db.collection('profiles').doc(reminder.customer_id).get();
                const prefs2 = customerProfile2.data()?.notification_settings || {};
                const enabled2 = prefs2.enabled !== false;
                const remindersCfg2 = prefs2.booking_reminders || {};
                const remindersEnabled2 = remindersCfg2.enabled !== false;
                const quiet2 = prefs2.quiet_hours || {};
                if (!enabled2 || !remindersEnabled2) {
                    console.log('⏭️ Reminder suppressed by user preferences');
                    batch.update(reminderDoc.ref, { sent: true });
                    continue;
                }
                // Quiet hours suppression (using customer's timezone)
                if (quiet2.enabled) {
                    const customerTimezone = customerProfile2.data()?.timezone || 'Asia/Dubai';
                    const currentHM = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: customerTimezone });
                    const [ch, cm] = currentHM.split(':').map(Number);
                    const nowMin = ch * 60 + cm;
                    const parseHM = (s) => {
                        const [h, m] = (s || '00:00').split(':').map((n) => parseInt(n, 10) || 0);
                        return h * 60 + m;
                    };
                    const start = parseHM(quiet2.start || '22:00');
                    const end = parseHM(quiet2.end || '08:00');
                    const inQuiet = start <= end ? (nowMin >= start && nowMin < end) : (nowMin >= start || nowMin < end);
                    if (inQuiet) {
                        console.log('🔕 Reminder suppressed due to quiet hours');
                        // Do not mark as sent; allow sending later outside quiet window
                        continue;
                    }
                }
                // Get service name
                const serviceDoc = await db.collection('services').doc(reminder.service_id).get();
                const serviceName = serviceDoc.data()?.title || 'الخدمة';
                // Get provider name
                const providerDoc = await db.collection('profiles').doc(reminder.provider_id).get();
                const providerName = providerDoc.data()?.display_name || 'المزود';
                // Format time message
                const minutesBefore = reminder.minutes_before;
                let timeMessage = '';
                if (minutesBefore < 60) {
                    timeMessage = `بعد ${minutesBefore} دقيقة`;
                }
                else if (minutesBefore === 60) {
                    timeMessage = 'بعد ساعة';
                }
                else if (minutesBefore === 120) {
                    timeMessage = 'بعد ساعتين';
                }
                else if (minutesBefore >= 1440) {
                    const days = Math.floor(minutesBefore / 1440);
                    timeMessage = days === 1 ? 'غداً' : `بعد ${days} أيام`;
                }
                else {
                    const hours = Math.floor(minutesBefore / 60);
                    timeMessage = `بعد ${hours} ساعات`;
                }
                // Calculate distance if available
                let distanceText = '';
                const customerProfile = await db.collection('profiles').doc(reminder.customer_id).get();
                const providerProfile = await db.collection('profiles').doc(reminder.provider_id).get();
                const customerData = customerProfile.data();
                const providerData = providerProfile.data();
                if (customerData?.latitude && providerData?.latitude) {
                    const distance = calculateDistance({ latitude: customerData.latitude, longitude: customerData.longitude }, { latitude: providerData.latitude, longitude: providerData.longitude });
                    if (distance < 1) {
                        distanceText = ` • ${Math.round(distance * 1000)} متر`;
                    }
                    else {
                        distanceText = ` • ${distance.toFixed(1)} كم`;
                    }
                }
                // Send notification
                try {
                    await sendNotification(customerToken, `⏰ تذكير: موعدك ${timeMessage}`, `${serviceName} مع ${providerName}${distanceText}`, {
                        type: 'booking_reminder',
                        booking_id: reminder.booking_id,
                        minutes_before: minutesBefore.toString(),
                        link: `/customer-dashboard?bookingId=${reminder.booking_id}`,
                    });
                    // Mark as sent
                    batch.update(reminderDoc.ref, {
                        sent: true,
                        sent_at: new Date(),
                    });
                }
                catch (fcmError) {
                    console.error(`❌ Failed to send reminder for ${reminder.booking_id}:`, fcmError.message);
                    // Mark as failed
                    batch.update(reminderDoc.ref, {
                        sent: false,
                        failed: true,
                        failed_at: new Date(),
                        error: fcmError.message
                    });
                }
                sentCount++;
                console.log(`✅ Reminder sent for booking ${reminder.booking_id}`);
            }
            catch (error) {
                console.error(`Error sending reminder ${reminderDoc.id}:`, error);
                // Don't mark as sent if there was an error
            }
        }
        await batch.commit();
        console.log(`📬 Sent ${sentCount} reminders successfully`);
    }
    catch (error) {
        console.error('Error in sendScheduledReminders:', error);
    }
});
// =============================================================================
// Scheduled system stats snapshot: counts of key collections for capacity planning
// =============================================================================
exports.snapshotSystemStats = (0, scheduler_1.onSchedule)({ schedule: 'every 24 hours', timeZone: 'Asia/Dubai' }, async () => {
    const trace = syntheticTrace('snapshotSystemStats');
    const started = Date.now();
    logTrace(trace, 'snapshotSystemStats:start');
    try {
        // Load previous snapshot (if any) to compute deltas
        let prevCounts = null;
        let prevDocId = null;
        try {
            const prevSnap = await db
                .collection('system_stats')
                .orderBy('captured_at', 'desc')
                .limit(1)
                .get();
            if (!prevSnap.empty) {
                const prevData = prevSnap.docs[0].data();
                prevDocId = prevSnap.docs[0].id;
                if (prevData?.counts) {
                    prevCounts = {
                        profiles: Number(prevData.counts.profiles || 0),
                        providers: Number(prevData.counts.providers || 0),
                        customers: Number(prevData.counts.customers || 0),
                        services: Number(prevData.counts.services || 0),
                        bookings: Number(prevData.counts.bookings || 0),
                    };
                }
            }
        }
        catch (e) {
            // If this fails (no index yet), proceed without deltas
            console.warn('[snapshotSystemStats] Previous snapshot lookup failed (continuing):', e);
        }
        const profilesSnap = await db.collection('profiles').get();
        let providers = 0;
        let customers = 0;
        profilesSnap.forEach((d) => {
            const ut = d.data()?.user_type;
            if (ut === 'provider')
                providers++;
            else if (ut === 'customer')
                customers++;
        });
        const servicesSnap = await db.collection('services').get();
        const bookingsSnap = await db.collection('bookings').get();
        // Aggregate booking statuses
        const bookingStatusCounts = {};
        bookingsSnap.forEach((d) => {
            const st = d.data()?.status || 'unknown';
            bookingStatusCounts[st] = (bookingStatusCounts[st] || 0) + 1;
        });
        const currentCounts = {
            profiles: profilesSnap.size,
            providers,
            customers,
            services: servicesSnap.size,
            bookings: bookingsSnap.size,
        };
        const deltas = prevCounts
            ? {
                profiles: currentCounts.profiles - prevCounts.profiles,
                providers: currentCounts.providers - prevCounts.providers,
                customers: currentCounts.customers - prevCounts.customers,
                services: currentCounts.services - prevCounts.services,
                bookings: currentCounts.bookings - prevCounts.bookings,
            }
            : null;
        const growthPct = prevCounts
            ? {
                profiles: prevCounts.profiles ? ((currentCounts.profiles - prevCounts.profiles) / prevCounts.profiles) * 100 : null,
                providers: prevCounts.providers ? ((currentCounts.providers - prevCounts.providers) / prevCounts.providers) * 100 : null,
                customers: prevCounts.customers ? ((currentCounts.customers - prevCounts.customers) / prevCounts.customers) * 100 : null,
                services: prevCounts.services ? ((currentCounts.services - prevCounts.services) / prevCounts.services) * 100 : null,
                bookings: prevCounts.bookings ? ((currentCounts.bookings - prevCounts.bookings) / prevCounts.bookings) * 100 : null,
            }
            : null;
        const docRef = db.collection('system_stats').doc();
        await docRef.set({
            captured_at: new Date(),
            counts: {
                ...currentCounts,
                booking_statuses: bookingStatusCounts,
            },
            previous: prevDocId ? { ref: prevDocId, counts: prevCounts } : null,
            deltas,
            growth_pct: growthPct,
        });
        console.log('[snapshotSystemStats] Snapshot written:', docRef.id);
        logTrace(trace, 'snapshotSystemStats:done', { duration_ms: Date.now() - started });
    }
    catch (e) {
        console.error('[snapshotSystemStats] Error:', e);
        logTrace(trace, 'snapshotSystemStats:error', { message: e?.message });
    }
});
// =============================================================================
// Scheduled duplicate monitor: run daily and log duplicate category groups
// =============================================================================
exports.monitorDuplicateCategories = (0, scheduler_1.onSchedule)({ schedule: 'every 24 hours', timeZone: 'Asia/Dubai' }, async () => {
    const trace = syntheticTrace('monitorDuplicateCategories');
    const started = Date.now();
    logTrace(trace, 'monitorDuplicateCategories:start');
    try {
        const snap = await db.collection('service_categories').get();
        const all = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
        const groups = {};
        const normalize = (cat) => {
            const ar = (cat.title_ar || cat.name_ar || '').trim().toLowerCase();
            const en = (cat.title_en || cat.name_en || cat.title || cat.name || '').trim().toLowerCase();
            const base = ar || en;
            return base.replace(/[\s]+/g, ' ').replace(/[ـ]/g, '').trim();
        };
        for (const c of all) {
            const key = normalize(c.data);
            if (!key)
                continue;
            if (!groups[key])
                groups[key] = [];
            groups[key].push(c.id);
        }
        const duplicateGroups = Object.entries(groups).filter(([, ids]) => ids.length > 1);
        if (duplicateGroups.length > 0) {
            console.warn(`[monitorDuplicateCategories] Found ${duplicateGroups.length} duplicate groups`);
            const sample = duplicateGroups.slice(0, 5).map(([k, ids]) => ({ key: k, count: ids.length, ids: ids.slice(0, 10) }));
            console.warn('[monitorDuplicateCategories] Sample:', JSON.stringify(sample));
        }
        else {
            console.log('[monitorDuplicateCategories] No duplicates found');
        }
    }
    catch (e) {
        console.error('[monitorDuplicateCategories] Error:', e);
        logTrace(trace, 'monitorDuplicateCategories:error', { message: e?.message });
    }
    finally {
        logTrace(trace, 'monitorDuplicateCategories:done', { duration_ms: Date.now() - started });
    }
});
// =============================================================================
// Scheduled pruning: delete request_traces older than 30 days
// =============================================================================
exports.pruneOldRequestTraces = (0, scheduler_1.onSchedule)({ schedule: 'every 24 hours', timeZone: 'Asia/Dubai' }, async () => {
    const trace = syntheticTrace('pruneOldRequestTraces');
    const started = Date.now();
    logTrace(trace, 'pruneOldRequestTraces:start');
    try {
        const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const cutoffIso = cutoff.toISOString();
        // ts is stored as ISO string, so lexicographical comparison works
        const snap = await db.collection('request_traces').where('ts', '<', cutoffIso).limit(500).get();
        if (snap.empty) {
            console.log('[pruneOldRequestTraces] No old traces to delete');
            return;
        }
        const bw = db.bulkWriter();
        let count = 0;
        snap.docs.forEach((d) => { bw.delete(d.ref); count++; });
        await bw.close();
        console.log(`[pruneOldRequestTraces] Deleted ${count} old trace docs`);
        logTrace(trace, 'pruneOldRequestTraces:done', { duration_ms: Date.now() - started, deleted: count });
    }
    catch (e) {
        console.error('[pruneOldRequestTraces] Error:', e);
        logTrace(trace, 'pruneOldRequestTraces:error', { message: e?.message });
    }
});
