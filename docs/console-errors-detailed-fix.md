# حل مشاكل الـ Console والـ CORS

## المشاكل الظاهرة في الصور:

### 1. ❌ RangeError: Invalid Date at Date.toISOString
**السبب**: محاولة استدعاء `.toISOString()` على تاريخ غير صالح في عدة أماكن

**الحل المطبق**: ✅
- أضفت دالة `safeToISODate()` في `OffersManagement.tsx`
- أضفت validation للتواريخ قبل حفظ إعدادات الإشعارات

---

### 2. ❌ Access to fetch CloudFunctions blocked by CORS / 404
**السبب الحقيقي**: Cloud Functions غير منشورة أو العنوان غير صحيح

**المشكلة**: 
```
https://us-central1-servyard-de527.cloudfunctions.net/sendTestNotification
```
يعطي 404 لأن Functions ليست منشورة على Firebase Cloud Functions!

**الحل**:

#### الطريقة 1: نشر Cloud Functions (موصى بها) ⭐

قم بنشر Functions على Firebase:

```bash
cd /Users/omar.matouki/TibrCode\ Apps/serv_yard
firebase deploy --only functions
```

بعد النشر، ستحصل على URLs مثل:
```
https://us-central1-servyard-de527.cloudfunctions.net/sendTestNotification
https://us-central1-servyard-de527.cloudfunctions.net/notifyNewBooking
https://us-central1-servyard-de527.cloudfunctions.net/notifyBookingStatusChange
```

#### الطريقة 2: استخدام Firebase Hosting مع Rewrites

إذا كنت تستخدم Firebase Hosting، عدّل `firebase.json`:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "/api/sendTestNotification",
        "function": "sendTestNotification"
      },
      {
        "source": "/api/notifyNewBooking",
        "function": "notifyNewBooking"
      },
      {
        "source": "/api/notifyBookingStatusChange",
        "function": "notifyBookingStatusChange"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs20",
    "predeploy": ["npm --prefix \"$RESOURCE_DIR\" run build"]
  }
}
```

ثم عدّل الكود لاستخدام `/api/sendTestNotification` بدلاً من URL الكامل.

---

### 3. ❌ XMLHttpRequest cannot load Firestore (CORS)
**السبب**: Domain `www.serv-yard.com` غير مضاف في Firebase Authorized Domains

**الحل**: ⚠️ **إجراء مطلوب**

1. اذهب إلى [Firebase Console](https://console.firebase.google.com)
2. اختر مشروع `servyard-de527`
3. **Authentication** → **Settings** → **Authorized domains**
4. اضغط **Add domain**
5. أضف: `www.serv-yard.com`
6. احفظ

**الدومينات المطلوبة**:
- ✅ localhost
- ✅ servyard-de527.firebaseapp.com
- ✅ servyard-de527.web.app
- ✅ serv-yard.com
- ❌ **www.serv-yard.com** ← يجب إضافته!

---

### 4. ❌ Preflight response not successful / Status code 404
**السبب**: CORS preflight request يفشل لأن CloudFunctions غير منشورة أو لا تدعم OPTIONS

**الحل**: تأكد من:
1. نشر Functions أولاً: `firebase deploy --only functions`
2. تفعيل CORS في Functions (موجود بالفعل في الكود: `{ cors: true }`)
3. إضافة الدومين في Firebase Authorized Domains

---

## الخطوات المطلوبة منك الآن:

### الخطوة 1: نشر Cloud Functions ⭐ **الأهم**
```bash
# في مجلد المشروع
cd /Users/omar.matouki/TibrCode\ Apps/serv_yard

# تسجيل الدخول إلى Firebase (إذا لم تكن مسجلاً)
firebase login

# نشر Functions
firebase deploy --only functions
```

**ملاحظة**: أول نشر قد يستغرق 3-5 دقائق

### الخطوة 2: إضافة Domain في Firebase
1. Firebase Console → Authentication → Settings
2. Authorized domains → Add domain
3. أضف: `www.serv-yard.com`

### الخطوة 3: إضافة Environment Variable في Vercel (اختياري)
```
VITE_FIREBASE_FUNCTIONS_URL=https://us-central1-servyard-de527.cloudfunctions.net
```

### الخطوة 4: Redeploy Vercel
بعد إضافة المتغير، اعمل redeploy في Vercel

---

## التحقق من أن Functions منشورة:

بعد `firebase deploy --only functions`، افتح:
```
https://console.firebase.google.com/project/servyard-de527/functions
```

يجب أن ترى:
- ✅ sendTestNotification
- ✅ notifyNewBooking
- ✅ notifyBookingStatusChange
- ✅ sendScheduledReminders
- ✅ dedupeServiceCategories
- ... إلخ

---

## اختبار Functions بعد النشر:

```bash
# Test من Terminal
curl -X POST https://us-central1-servyard-de527.cloudfunctions.net/sendTestNotification \
  -H "Content-Type: application/json" \
  -d '{"userId":"YOUR_USER_ID_HERE"}'
```

يجب أن تحصل على response بدلاً من 404.

---

## ملخص الإصلاحات المطبقة في الكود:

1. ✅ إضافة safe date handling في `OffersManagement.tsx`
2. ✅ إضافة validation للإعدادات قبل الحفظ
3. ✅ إضافة logging أفضل لـ test notifications
4. ✅ إضافة error messages أوضح
5. ✅ إصلاح كود الاتصال بـ CloudFunctions
6. ⚠️ **يحتاج نشر Functions على Firebase**
7. ⚠️ **يحتاج إضافة www.serv-yard.com في Firebase**

---

## إذا واجهت مشكلة في النشر:

```bash
# تحقق من أنك مسجل دخول
firebase projects:list

# يجب أن ترى servyard-de527 في القائمة
# إذا لم يظهر، اربط المشروع:
firebase use servyard-de527

# ثم حاول النشر مرة أخرى
firebase deploy --only functions
```
