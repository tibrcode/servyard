import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { auth } from 'firebase-functions/v1';
import { defineSecret } from 'firebase-functions/params';

admin.initializeApp();
const db = admin.firestore();

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
