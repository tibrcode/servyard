## Notifications Debug & Testing

هذا الملف يشرح كيفية اختبار وتشخيص نظام التنبيهات (Push + Toast) في ServYard.

### 1. المكوّنات الأساسية

| جزء | وظيفة |
|-----|-------|
| `firebase-messaging-sw.js` | استقبال رسائل FCM في الخلفية وعرض إشعار | 
| `requestNotificationPermission()` | طلب الإذن + الحصول على FCM Token وحفظه في Profile |
| `onMessageListener()` | استقبال رسائل FCM أثناء فتح التبويب (Foreground) |
| صفحة `/debug/notifications` | عرض حالة الإذن، التوكن، الخدمة، أزرار اختبار |
| Cloud Function `sendTestNotification` | إرسال إشعار تجريبي للمستخدم |
| إعدادات المستخدم (NotificationSettings) | التحكم بالتفضيلات + زر إرسال تجريبي |
| وظيفة مجدولة `sendScheduledReminders` | إرسال تذكيرات الحجز حسب الوقت |

### 2. اختبار سريع (Quick Flow)

1. افتح المتصفح على بيئة HTTPS (أو localhost).
2. اذهب إلى `/debug/notifications`.
3. اضغط "Request Permission & Token" واسمح بالإشعار.
4. تأكد ظهور جزء من التوكن (مبهم) في الصفحة.
5. اضغط "Send Test Push (Backend)" — إذا Cloud Function منشور ستصلك رسالة Push.
6. أغلق التبويب (اترك المتصفح يعمل) وكرر الخطوة 5 للاختبار الخلفي.
7. عدّل حالة حجز مؤكد لترى تذكير قبل الموعد (إذا الوقت مناسب).

### 3. تشخيص المشكلات الشائعة

| المشكلة | السبب المحتمل | الحل |
|----------|---------------|------|
| لا يصل إشعار | لم يتم طلب الإذن | اطلب الإذن من صفحة debug أو من الإعدادات |
| التوكن فارغ في Firestore | فشل تسجيل SW أو مشكلة في FCM | راجع Console: تأكد من رسالة تسجيل SW و"FCM Token saved" |
| يظهر Toast لكن ليس إشعار سيستيم | foreground فقط | أغلق التبويب وجرب إرسال push من الخلفية |
| Safari لا يظهر | محدوديات المتصفح | جرّب Chrome أولاً، تأكد من تفعيل الإشعارات في النظام |
| لا تصل التذكيرات | وظيفة مجدولة لم تُنشر أو الوقت غير مناسب | تأكد من `sendScheduledReminders` في Firebase Functions Logs |

### 4. استخدام Cloud Function التجريبية

Endpoint: `sendTestNotification`

Body أمثلة:

```json
{ "userId": "USER_ID" }
```

أو:

```json
{ "token": "FCM_TOKEN", "title": "Custom", "body": "Hello" }
```

### 5. التذكيرات (Reminders)

عند تأكيد الحجز:
1. يتم إنشاء وثائق في `booking_reminders` لكل وقت تذكير (مثلاً 60 دقيقة قبل).
2. الوظيفة المجدولة `sendScheduledReminders` تعمل كل 5 دقائق:
   - تبحث عن `sent == false` و `reminder_time <= now + 5m`
   - ترسل الإشعار ثم تحدّث الوثيقة إلى `sent: true`.

### 6. دعم الموبايل (Capacitor Native)

ملف `src/lib/native/push.ts` يحتوي هيكل مبدئي:
```ts
initNativePush((token) => { /* map native token */ });
```

خطوات لاحقة:
1. Android: أضف `google-services.json` إلى مجلد `android/app/` ثم حدث Gradle.
2. iOS: أضف مفتاح APNs في Firebase، فعّل Push Capabilities في Xcode.
3. عدل backend لحفظ token خاص بالمنصة إذا رغبت بالتمييز.

### 7. أسئلة متكررة

Q: هل أحتاج gcm_sender_id في manifest؟
A: أضفناه لأجل التوافق مع متصفحات أقدم، لكنه ليس ضروري مع أحدث FCM.

Q: هل يمكن أن أظهر رابط عند الضغط على الإشعار؟
A: نعم، نرسل `data.link` ويستخدمه الـ SW أو مستمع native لفتح الصفحة.

### 8. تحسينات مستقبلية مقترحة

- إضافة retry تلقائي عند فشل getToken.
- توحيد واجهة push (web/native) في hook واحد.
- إضافة مخزن داخلي لآخر 20 إشعار في IndexedDB.
- دعم تصنيف أنواع الإشعارات (booking, reminder, system...).

### 9. تنظيف (Maintenance)

إذا تغيّر VAPID Key:
1. حدث متغير البيئة `VITE_FIREBASE_VAPID_KEY`.
2. امسح التوكن القديم من المتصفح: DevTools > Application > Clear storage.
3. أعد طلب الإذن للحصول على توكن جديد.

### 10. روابط مفيدة

- Firebase Cloud Messaging Web: https://firebase.google.com/docs/cloud-messaging/js/client
- Capacitor Push: https://capacitorjs.com/docs/apis/push-notifications

---

آخر تحديث: 2025-11-07
