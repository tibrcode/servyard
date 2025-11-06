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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendScheduledReminders = exports.getLocationStats = exports.findNearbyProviders = exports.adminDeleteUser = exports.onAuthDeleteUser = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const v1_1 = require("firebase-functions/v1");
const params_1 = require("firebase-functions/params");
admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();
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
exports.adminDeleteUser = (0, https_1.onRequest)({ cors: true, maxInstances: 1, secrets: [ADMIN_DELETE_TOKEN] }, async (req, res) => {
    if (req.method !== 'POST')
        return res.status(405).send('Method Not Allowed');
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
            return res.status(500).send('Server not configured');
        if (!headerKey || headerKey !== secretValue)
            return res.status(401).send('Unauthorized');
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
        return res.status(404).send('User not found for email');
    }
    if (!uid)
        return res.status(400).send('Missing uid or email');
    // Try to delete Auth user first (ignore if not found)
    try {
        await admin.auth().deleteUser(uid);
    }
    catch (e) {
        if (e?.code !== 'auth/user-not-found')
            throw e;
    }
    await deleteUserData(uid);
    return res.json({ ok: true });
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
        let query = db.collection('profiles')
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
    try {
        await messaging.send({
            token: fcmToken,
            notification: { title, body },
            data: data || {},
            webpush: {
                fcmOptions: {
                    link: data?.link || '/',
                },
            },
        });
        return true;
    }
    catch (error) {
        console.error('Error sending FCM notification:', error);
        return false;
    }
}
/**
 * Get user's FCM token from profile
 */
async function getUserFCMToken(userId) {
    try {
        const profile = await db.collection('profiles').doc(userId).get();
        return profile.data()?.fcm_token || null;
    }
    catch (error) {
        console.error('Error getting FCM token:', error);
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
        const preferences = customerDoc.data()?.notification_settings || {
            reminder_times: [60], // Default: 1 hour before
        };
        const bookingDate = new Date(booking.booking_date);
        const reminders = [];
        // Create reminder documents for each preferred time
        for (const minutesBefore of preferences.reminder_times || [60]) {
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
// NOTE: Firestore triggers (onBookingCreated, onBookingUpdated) are temporarily
// NOTE: Firestore triggers (onBookingCreated, onBookingUpdated) are temporarily
// disabled due to region mismatch between Firestore (me-central2) and Cloud Functions (us-central1).
// These will be re-enabled once the region issue is resolved.
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
                // Get customer's FCM token
                const customerToken = await getUserFCMToken(reminder.customer_id);
                if (!customerToken) {
                    console.log(`No FCM token for customer ${reminder.customer_id}`);
                    batch.update(reminderDoc.ref, { sent: true });
                    continue;
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
                await sendNotification(customerToken, `⏰ تذكير: موعدك ${timeMessage}`, `${serviceName} مع ${providerName}${distanceText}`, {
                    type: 'booking_reminder',
                    booking_id: reminder.booking_id,
                    minutes_before: minutesBefore.toString(),
                    link: '/customer-dashboard',
                });
                // Mark as sent
                batch.update(reminderDoc.ref, {
                    sent: true,
                    sent_at: new Date(),
                });
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
