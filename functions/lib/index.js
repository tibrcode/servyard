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
exports.adminDeleteUser = exports.onAuthDeleteUser = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const v1_1 = require("firebase-functions/v1");
const params_1 = require("firebase-functions/params");
admin.initializeApp();
const db = admin.firestore();
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
