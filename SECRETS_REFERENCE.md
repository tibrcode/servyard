# 🔑 المفاتيح والبيانات الحساسة

## ⚠️ معلومات مهمة

هذا الملف يحتوي على بيانات حساسة. **لا تشاركه علناً!**

---

## 🔐 بيانات Firebase

### Project Information
```
Project ID:       servyard-de527
Project Number:   866507388194
Auth Domain:      servyard-de527.firebaseapp.com
Storage Bucket:   servyard-de527.firebasestorage.app
Measurement ID:   G-GDCET0K1NN
```

### API Configuration
```
API Key:           AIzaSyAKG7vAEa2xrON6YqyysgdaEKQXQu1cX4g
App ID:            1:866507388194:web:3e3d6ea94ce274781fe17b
Messaging Sender:  866507388194
```

### VAPID Key (للإشعارات)
```
VAPID Key:         BJZTCoK1yQyvIv1GXWU_QjDa2wclVUfMZbWhUERX2-
                   FjQHctjrhL5nQ3gwu2oYDQTw3T28PiMGaiVWza4vHQ4ak
```

---

## 📁 أين تجد البيانات

### في الكود:
- **`.env`** ← جميع المفاتيح
- **`public/firebase-messaging-sw.js`** ← Firebase Config
- **`functions/src/index.ts`** ← Cloud Functions Config

### في Firebase Console:
- **Project Settings** ← جميع المفاتيح
- **Cloud Messaging** ← VAPID Key
- **Authentication** ← Authorized Domains

### في Vercel:
- **Environment Variables** ← نفس بيانات `.env`

---

## ⚡ الأوامر الهامة

### نشر Cloud Functions
```bash
cd functions
npm run build
npm run deploy
```

### نشر Security Rules
```bash
firebase deploy --only firestore:rules
```

### عرض السجلات
```bash
firebase functions:log
firebase deploy --verbose
```

### اختبار قبل النشر
```bash
firebase deploy --dry-run
npm run typecheck
npm run build
```

---

## 🌐 الروابط الهامة

| الخدمة | الرابط |
|-------|--------|
| Firebase Console | https://console.firebase.google.com/ |
| Vercel Dashboard | https://vercel.com/dashboard |
| GitHub Repo | https://github.com/tibrcode/servyard |
| FCM Documentation | https://firebase.google.com/docs/cloud-messaging |
| Firestore Rules | https://firebase.google.com/docs/firestore/security/start |

---

## 🔒 نصائح الأمان

### ✅ افعل:
- ✓ استخدم `.env` للبيانات الحساسة
- ✓ أضف `.env` إلى `.gitignore`
- ✓ استخدم Environment Variables في Vercel
- ✓ راجع Security Rules بانتظام
- ✓ استخدم HTTPS فقط

### ❌ لا تفعل:
- ✗ لا تشارك API Keys علناً
- ✗ لا تضع البيانات الحساسة في الكود
- ✗ لا تجعل Firestore Rules مفتوحة
- ✗ لا تستخدم HTTP
- ✗ لا تحفظ التوكنات بشكل واضح

---

## 📊 حالة المفاتيح

| المفتاح | الحالة | الملف |
|--------|--------|------|
| API Key | ✅ مضاف | `.env` |
| VAPID Key | ✅ مضاف | `.env` |
| App ID | ✅ صحيح | Firebase |
| Auth Domain | ✅ محقق | Firestore |
| Storage Bucket | ✅ فعال | Firebase |

---

## 🚀 ملخص الإعدادات

```javascript
// جميع البيانات موجودة ومصحح
{
  "firebase": {
    "projectId": "✅ servyard-de527",
    "apiKey": "✅ AIzaSyAKG7vAE...",
    "authDomain": "✅ servyard-de527.firebaseapp.com",
    "messagingSenderId": "✅ 866507388194",
    "vapidKey": "✅ BJZTCoK1yQyvIv1..."
  },
  "status": "✅ جاهز للنشر الفوري"
}
```

---

## ⚡ التحقق السريع

```bash
# تحقق من أن البيانات محفوظة
cat .env | grep FIREBASE

# تحقق من Firebase Config
grep "firebase.initializeApp" public/firebase-messaging-sw.js

# تحقق من VAPID Key
grep "VAPID_KEY" src/lib/firebase/notifications.ts
```

---

## 🎯 الخطوات النهائية

1. ✅ تحقق من أن `.env` محدث
2. ✅ تحقق من `firebase-messaging-sw.js`
3. ✅ تأكد من إضافة Environment Variables في Vercel
4. ✅ نشر Cloud Functions
5. ✅ نشر Firestore Rules
6. ✅ نشر على الويب

---

**⚠️ تذكر: هذه البيانات حساسة - احمِها جيداً!** 🔒

