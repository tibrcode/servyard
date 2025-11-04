# 📍 دليل الملفات - أين يمكنك العثور على كل شيء

## 🔑 بيانات التكوين

### VAPID Key
📄 **الملف:** `.env`
```env
VITE_FIREBASE_VAPID_KEY=BJZTCoK1yQyvIv1GXWU_QjDa2wclVUfMZbWhUERX2-FjQHctjrhL5nQ3gwu2oYDQTw3T28PiMGaiVWza4vHQ4ak
```

### Firebase Config
📄 **الملف:** `public/firebase-messaging-sw.js` (الأسطر 1-20)
```javascript
firebase.initializeApp({
  apiKey: "AIzaSyAKG7vAEa2xrON6YqyysgdaEKQXQu1cX4g",
  authDomain: "servyard-de527.firebaseapp.com",
  projectId: "servyard-de527",
  ...
})
```

---

## 📱 الإشعارات

### 1. الإشعارات الفورية (Foreground)
📄 **الملف:** `src/lib/firebase/notifications.ts`
- **السطور:** 1-108
- **الوظائف:**
  - `requestNotificationPermission()` ← طلب الإذن
  - `onMessageListener()` ← الاستماع للإشعارات
  - `disableNotifications()` ← إيقاف الإشعارات

### 2. الإشعارات في الخلفية (Background)
📄 **الملف:** `public/firebase-messaging-sw.js`
- **السطور:** 18-30
- **الوظائف:**
  - `onBackgroundMessage()` ← معالجة الخلفية
  - `notificationclick` ← الضغط على الإشعار

### 3. تفعيل الإشعارات في التطبيق
📄 **الملف:** `src/App.tsx`
- **الأسطر:** 13 (import)
- **الأسطر:** 53-59 (useEffect للتفعيل)
- **الأسطر:** 61-70 (useEffect للاستماع)

---

## ☁️ Cloud Functions

### إرسال الإشعارات
📄 **الملف:** `functions/src/index.ts`

#### 1. عند حجز جديد
```typescript
// الأسطر: ~80-120
exports.sendBookingNotification = functions.firestore
  .document('bookings/{bookingId}')
  .onCreate(async (snap, context) => {
    // إرسال إشعار للمزود
  })
```

#### 2. عند تأكيد الحجز
```typescript
// الأسطر: ~130-170
exports.sendBookingConfirmationNotification = functions.firestore
  .document('bookings/{bookingId}')
  .onUpdate(async (change, context) => {
    // إرسال إشعار للعميل
  })
```

#### 3. عند التقييم
```typescript
// الأسطر: ~180-220
exports.sendReviewNotification = functions.firestore
  .document('reviews/{reviewId}')
  .onCreate(async (snap, context) => {
    // إرسال إشعار للمزود
  })
```

---

## 📊 Analytics

### تتبع الأحداث
📄 **الملف:** `src/lib/firebase/analytics.ts`
- **الأسطر:** 1-150
- **الأحداث المتتبعة:**
  - `trackServiceSearch()` ← البحث عن خدمة
  - `trackServiceView()` ← عرض الخدمة
  - `trackBookingCreated()` ← إنشاء حجز
  - `trackReviewSubmitted()` ← إضافة تقييم
  - و 11 حدث آخر

### الدمج في الصفحات
📄 **الملف:** `src/components/booking/BookingModal.tsx`
- **السطور:** 5 (import)
- **السطور:** 80+ (استدعاء الدوال)

---

## 🔒 Security Rules

### قواعد الأمان
📄 **الملف:** `firestore.rules`
- **الأسطر:** 1-120
- **المجموعات:**
  - `profiles` ← قراءة عامة، تعديل للمالك
  - `services` ← قراءة عامة، كتابة للمزود
  - `bookings` ← قراءة للطرفين
  - `reviews` ← قراءة عامة، كتابة للعميل
  - `categories` ← قراءة عامة، كتابة للأدمن

---

## 📋 توثيق شاملة

### ملفات التوثيق:

| الملف | المحتوى |
|-----|---------|
| `UPDATES_DEC_2024.md` | ملخص جميع التحديثات |
| `NOTIFICATIONS_SETUP.md` | تعليمات التفعيل التفصيلية |
| `LAUNCH_CHECKLIST.md` | قائمة المراجعة السريعة |
| `NOTIFICATIONS_COMPLETE.md` | ملخص التكامل الكامل |
| `FILES_GUIDE.md` | دليل الملفات (هذا الملف) |

---

## 🔍 البحث السريع

### أبحث عن...

**الإشعارات الفورية؟**
→ `src/lib/firebase/notifications.ts`

**معالج الخلفية؟**
→ `public/firebase-messaging-sw.js`

**تفعيل الإشعارات؟**
→ `src/App.tsx` (الأسطر 53-70)

**Cloud Functions؟**
→ `functions/src/index.ts`

**Analytics؟**
→ `src/lib/firebase/analytics.ts`

**Security Rules؟**
→ `firestore.rules`

**VAPID Key؟**
→ `.env` (السطر 8)

---

## 🎯 سير العمل

### مسار الإشعار:

```
1. حدث في التطبيق
   └─ src/components/booking/BookingModal.tsx
       └─ trackBookingCreated()

2. تُرسل البيانات
   └─ Firestore Database
       └─ bookings collection

3. Cloud Function يُستدعى
   └─ functions/src/index.ts
       └─ sendBookingNotification()

4. إشعار يُرسل
   └─ Firebase Cloud Messaging
       └─ FCM Token

5. معالجة الإشعار
   ├─ (إذا كان التطبيق مفتوحاً)
   │  └─ src/App.tsx → onMessageListener()
   │     └─ toast({ title, description })
   │
   └─ (إذا كان التطبيق مغلقاً)
      └─ public/firebase-messaging-sw.js
         └─ onBackgroundMessage()
            └─ self.registration.showNotification()
```

---

## 📞 تعديلات سريعة

### إذا أردت تغيير نص الإشعار:
→ `functions/src/index.ts` (ابحث عن `notificationTitle`)

### إذا أردت إضافة معالج جديد:
→ `public/firebase-messaging-sw.js` (أضف event listener)

### إذا أردت تتبع حدث جديد:
→ `src/lib/firebase/analytics.ts` (أضف دالة `trackXxx()`)

### إذا أردت تعديل Security Rules:
→ `firestore.rules` (عدّل match statement)

---

## ✅ تم الإنجاز

- ✅ جميع الملفات محدثة
- ✅ جميع البيانات صحيحة
- ✅ جميع التوثيق جاهز
- ✅ البناء ناجح
- ✅ لا توجد أخطاء

---

**كل شيء منظم وجاهز! 🎉**

