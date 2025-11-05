# 🔑 إعداد Google Maps API Key - خطوات سريعة

**المشروع:** servyard-de527 (موجود مسبقاً ✅)

---

## ✅ **الخطوات المتبقية:**

### **1️⃣ تفعيل الـ APIs (في Google Cloud Console):**

```
الموقع: https://console.cloud.google.com/google/maps-apis
المشروع: servyard-de527

الـ APIs المطلوبة:
├─ Maps JavaScript API     ← للخريطة التفاعلية
├─ Places API              ← للـ Auto-complete
└─ Geocoding API           ← اختياري (للتحويل)
```

**الخطوات:**
1. افتح: https://console.cloud.google.com/apis/library?project=servyard-de527
2. ابحث عن "Maps JavaScript API"
3. اضغط "ENABLE"
4. كرر للـ "Places API"

---

### **2️⃣ إنشاء API Key:**

```
الموقع: https://console.cloud.google.com/google/maps-apis/credentials?project=servyard-de527
```

**الخطوات:**
1. اضغط "+ CREATE CREDENTIALS"
2. اختر "API key"
3. انسخ الـ Key فوراً
4. اضغط "RESTRICT KEY"

---

### **3️⃣ تقييد الـ Key (مهم للأمان!):**

```
Application restrictions:
├─ اختر: HTTP referrers (websites)
└─ أضف:
    ├─ http://localhost:*
    ├─ https://localhost:*
    ├─ https://servyard.vercel.app/*
    └─ https://*.vercel.app/*

API restrictions:
├─ اختر: Restrict key
└─ اختر:
    ├─ Maps JavaScript API ✅
    ├─ Places API ✅
    └─ Geocoding API ✅
```

---

### **4️⃣ إضافة الـ Key للمشروع:**

**الملف:** `.env.local` (موجود بالفعل ✅)

**افتح الملف:**
```bash
open .env.local
# أو
code .env.local
```

**استبدل السطر:**
```bash
VITE_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
```

**بالـ Key الفعلي:**
```bash
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **استبدل** `AIzaSyBxxxx...` بالـ Key الحقيقي من Google Cloud!

---

### **5️⃣ اختبار:**

```bash
# 1. أعد تشغيل dev server
npm run dev

# 2. افتح المتصفح
open http://localhost:5173

# 3. سجل دخول كمزود

# 4. اذهب إلى Edit Profile

# 5. يجب أن ترى:
#    ✅ حقل Auto-complete للعنوان
#    ✅ خريطة تفاعلية
#    ✅ لا أخطاء في Console
```

---

## 🔍 **التحقق من التفعيل:**

### **في Google Cloud Console:**

1. **افتح:** https://console.cloud.google.com/google/maps-apis/overview?project=servyard-de527

2. **يجب أن ترى:**
   ```
   APIs:
   ├─ Maps JavaScript API      [Enabled ✅]
   ├─ Places API               [Enabled ✅]
   └─ Geocoding API            [Enabled ✅]
   
   Credentials:
   └─ API Key: AIzaSyBxxxx... [Restricted ✅]
   ```

---

## ⚠️ **نصائح أمان:**

```
❌ لا تشارك الـ API Key أبداً
❌ لا تضعه في Git
❌ لا تنشره على GitHub/Discord
✅ دائماً قيّد الـ Key
✅ راقب الاستخدام يومياً
✅ فعّل Budget Alerts
```

---

## 💰 **مراقبة التكاليف:**

```
الموقع: https://console.cloud.google.com/billing

تفعيل Budget Alert:
├─ Budgets & alerts
├─ Create Budget
├─ Amount: $20 (مثلاً)
└─ Alerts: 50%, 90%, 100%
```

---

## 📊 **الحد المجاني:**

```
✅ $200 رصيد مجاني شهرياً
✅ 28,000 تحميل خريطة مجاناً
✅ معظم التطبيقات لن تدفع شيء
```

---

## 🆘 **حل المشاكل:**

### **"Google is not defined":**
```bash
# السبب: API Key غير موجود أو خطأ

# الحل:
1. تحقق من .env.local
2. تأكد أن الاسم صحيح: VITE_GOOGLE_MAPS_API_KEY
3. أعد تشغيل npm run dev
```

### **"This API key is not authorized":**
```bash
# السبب: localhost غير مسموح في Restrictions

# الحل:
1. اذهب إلى Credentials
2. اضغط على الـ Key
3. أضف: http://localhost:*
4. Save
```

### **خريطة رمادية فارغة:**
```bash
# السبب: Maps JavaScript API غير مفعّل

# الحل:
1. اذهب إلى APIs Library
2. ابحث عن "Maps JavaScript API"
3. اضغط Enable
```

---

## ✅ **Checklist:**

```
☐ تفعيل Maps JavaScript API
☐ تفعيل Places API
☐ تفعيل Geocoding API (اختياري)
☐ إنشاء API Key
☐ تقييد الـ Key (HTTP referrers)
☐ تقييد الـ Key (APIs)
☐ نسخ الـ Key
☐ إضافة إلى .env.local
☐ التأكد من .gitignore
☐ إعادة تشغيل dev server
☐ اختبار الخريطة
☐ اختبار Auto-complete
☐ لا أخطاء في Console
```

---

## 🚀 **جاهز؟**

بعد إتمام جميع الخطوات:

```bash
npm run dev
```

افتح: http://localhost:5173

استمتع بالخريطة التفاعلية! 🗺️✨

---

**آخر تحديث:** 5 نوفمبر 2025  
**المشروع:** servyard-de527  
**الحالة:** ✅ جاهز للتطبيق
