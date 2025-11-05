import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { auth } from 'firebase-functions/v1';
import { defineSecret } from 'firebase-functions/params';

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

// Secret to protect the admin HTTP endpoint
const ADMIN_DELETE_TOKEN = defineSecret('ADMIN_DELETE_TOKEN');

async function deleteByQuery(col: string, field: string, value: string) {
  const snap = await db.collection(col).where(field, '==', value).get();
  if (snap.empty) return;
  const bw = db.bulkWriter();
  snap.docs.forEach((d: admin.firestore.QueryDocumentSnapshot) => bw.delete(d.ref));
  await bw.close();
}

async function deleteByServiceIds(col: string, serviceIds: string[]) {
  if (serviceIds.length === 0) return;
  const bw = db.bulkWriter();
  for (const id of serviceIds) {
    const snap = await db.collection(col).where('service_id', '==', id).get();
  snap.docs.forEach((d: admin.firestore.QueryDocumentSnapshot) => bw.delete(d.ref));
  }
  await bw.close();
}

async function deleteUserData(uid: string) {
  // Try to read role
  let role: 'provider' | 'customer' | null = null;
  try {
    const profileSnap = await db.collection('profiles').doc(uid).get();
    if (profileSnap.exists) {
      role = (profileSnap.data()?.user_type as any) || null;
    }
  } catch {}

  if (role === 'provider') {
  const servicesSnap = await db.collection('services').where('provider_id', '==', uid).get();
  const serviceIds = servicesSnap.docs.map((d: admin.firestore.QueryDocumentSnapshot) => d.id);

    await deleteByServiceIds('service_availability', serviceIds);
    await deleteByServiceIds('service_special_dates', serviceIds);

    await deleteByQuery('reviews', 'provider_id', uid);
    await deleteByQuery('offers', 'provider_id', uid);
    await deleteByQuery('bookings', 'provider_id', uid);

    if (!servicesSnap.empty) {
      const bw = db.bulkWriter();
  servicesSnap.docs.forEach((d: admin.firestore.QueryDocumentSnapshot) => bw.delete(d.ref));
      await bw.close();
    }
  }

  // Customer side
  await deleteByQuery('bookings', 'customer_id', uid);
  await deleteByQuery('reviews', 'customer_id', uid);

  // Profile last
  await db.collection('profiles').doc(uid).delete().catch(() => {});
}

// 1) Trigger: when a user is deleted from Firebase Authentication (e.g., from the Console)
export const onAuthDeleteUser = auth.user().onDelete(async (userRecord) => {
  const uid = userRecord.uid as string;
  await deleteUserData(uid);
});

// 2) Admin HTTP endpoint: POST /adminDeleteUser with header x-admin-key and body { uid }
export const adminDeleteUser = onRequest({ cors: true, maxInstances: 1, secrets: [ADMIN_DELETE_TOKEN] }, async (req: any, res: any) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  // AuthN: either Bearer ID token with admin rights OR x-admin-key secret
  const bearer = (req.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
  const headerKey = (req.get('x-admin-key') || req.query.key) as string | undefined;
  const secretValue = ADMIN_DELETE_TOKEN.value();

  let isAuthorized = false;
  if (bearer) {
    try {
      const decoded = await admin.auth().verifyIdToken(bearer);
  const email: string | undefined = (decoded as any)?.email;
  const hasAdminClaim = (decoded as any)?.admin === true;
  const emailDomainOk = typeof email === 'string' && /@(tibrcode\.com|servyard\.com|serv-yard\.com)$/i.test(email || '');
  const specificAdmin = typeof email === 'string' && email.toLowerCase() === 'admin@servyard.com';
      if (hasAdminClaim || emailDomainOk || specificAdmin) {
        isAuthorized = true;
      }
    } catch {}
  }
  if (!isAuthorized) {
    if (!secretValue) return res.status(500).send('Server not configured');
    if (!headerKey || headerKey !== secretValue) return res.status(401).send('Unauthorized');
    isAuthorized = true;
  }

  // Accept uid or email
  let uid = (req.body?.uid || req.query.uid) as string | undefined;
  const emailParam = (req.body?.email || req.query.email) as string | undefined;
  try {
    if (!uid && emailParam) {
      const userRecord = await admin.auth().getUserByEmail(emailParam);
      uid = userRecord.uid;
    }
  } catch (e: any) {
    return res.status(404).send('User not found for email');
  }
  if (!uid) return res.status(400).send('Missing uid or email');

  // Try to delete Auth user first (ignore if not found)
  try {
    await admin.auth().deleteUser(uid);
  } catch (e: any) {
    if (e?.code !== 'auth/user-not-found') throw e;
  }

  await deleteUserData(uid);
  return res.json({ ok: true });
});

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

// ═══════════════════════════════════════════════════════════════════════════
// 🌍 Cloud Functions للبحث الجغرافي
// Geographic Search Cloud Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * حساب المسافة بين نقطتين باستخدام Haversine formula
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // نصف قطر الأرض بالكيلومتر
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
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
export const findNearbyProviders = onRequest(
  { cors: true },
  async (req, res) => {
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
      const providers: any[] = [];
      
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
        const distance = calculateDistance(
          latitude,
          longitude,
          data.latitude,
          data.longitude
        );

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

        const providerIds = new Set(
          servicesSnapshot.docs.map(doc => doc.data().provider_id)
        );

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

    } catch (error: any) {
      console.error('Error in findNearbyProviders:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
      return;
    }
  }
);

/**
 * الحصول على إحصائيات المزودين حسب المنطقة
 * Get provider statistics by region
 */
export const getLocationStats = onRequest(
  { cors: true },
  async (req, res) => {
    try {
      const snapshot = await db.collection('profiles')
        .where('user_type', '==', 'provider')
        .get();

      const stats: Record<string, { count: number; providers: string[] }> = {};

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

    } catch (error: any) {
      console.error('Error in getLocationStats:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
      return;
    }
  }
);
