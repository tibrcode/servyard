# 🗺️ إعداد Google Maps API - دليل سريع
# Google Maps API Setup Guide

---

## 🎯 **الخطوات الرئيسية**

### **الخطوة 1: إنشاء Google Cloud Project**

1. انتقل إلى: https://console.cloud.google.com/
2. اضغط **Select a project** → **New Project**
3. أدخل اسم المشروع (مثل: "ServYard")
4. اضغط **Create**

---

### **الخطوة 2: تفعيل الـ APIs المطلوبة**

في Google Cloud Console:

#### **2.1 Maps JavaScript API:**
1. انتقل إلى: **APIs & Services** → **Library**
2. ابحث عن "Maps JavaScript API"
3. اضغط **Enable**

#### **2.2 Places API:**
1. في نفس الصفحة (Library)
2. ابحث عن "Places API"
3. اضغط **Enable**

#### **2.3 Geocoding API (اختياري):**
1. ابحث عن "Geocoding API"
2. اضغط **Enable**

---

### **الخطوة 3: إنشاء API Key**

1. انتقل إلى: **APIs & Services** → **Credentials**
2. اضغط **+ Create Credentials** → **API Key**
3. انسخ الـ API Key مباشرةً
4. **⚠️ مهم:** لا تشارك هذا الـ Key أبداً!

**مثال على API Key:**
```
AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### **الخطوة 4: تقييد API Key (للأمان)**

#### **4.1 Application Restrictions:**
1. اضغط على اسم الـ Key الذي أنشأته
2. تحت **Application restrictions**:
   - اختر **HTTP referrers (web sites)**
3. اضغط **+ Add an item** وأضف:
   ```
   http://localhost:*
   https://localhost:*
   https://your-domain.com/*
   https://*.vercel.app/*
   ```
4. اضغط **Save**

#### **4.2 API Restrictions:**
1. في نفس الصفحة، تحت **API restrictions**:
   - اختر **Restrict key**
2. اختر:
   - ✅ Maps JavaScript API
   - ✅ Places API
   - ✅ Geocoding API (إذا فعّلته)
3. اضغط **Save**

---

### **الخطوة 5: إضافة API Key للمشروع**

#### **5.1 إنشاء ملف `.env.local`:**

في جذر المشروع، أنشئ ملف `.env.local`:

```bash
# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **استبدل** `AIzaSyBxxxx...` بالـ Key الفعلي الخاص بك!

#### **5.2 إضافة `.env.local` إلى `.gitignore`:**

```bash
echo ".env.local" >> .gitignore
```

---

### **الخطوة 6: اختبار API Key**

#### **6.1 تشغيل المشروع:**
```bash
npm run dev
```

#### **6.2 اختبار الخريطة:**
1. افتح المتصفح: http://localhost:5173
2. انتقل إلى صفحة **Edit Profile** (للمزودين)
3. يجب أن تظهر الخريطة بدون أخطاء

#### **6.3 اختبار Auto-complete:**
1. ابحث عن حقل إدخال العنوان
2. ابدأ بكتابة عنوان (مثل: "Amman")
3. يجب أن تظهر اقتراحات تلقائياً

---

## 💰 **التكاليف**

### **الاستخدام المجاني الشهري:**

| الخدمة | الحد المجاني | السعر بعد الحد |
|--------|---------------|-----------------|
| Maps JavaScript API | 28,000 تحميل | $7 لكل 1,000 |
| Places Autocomplete | ضمن $200 رصيد | $2.83 لكل 1,000 |
| Geocoding API | ضمن $200 رصيد | $5 لكل 1,000 |

### **ملاحظات:**
- ✅ Google تمنح **$200 رصيد مجاني شهرياً**
- ✅ معظم التطبيقات الصغيرة والمتوسطة **لن تدفع شيء**
- ⚠️ تحتاج بطاقة ائتمان للتحقق (لن يُسحب منها إلا إذا تجاوزت الحد)

---

## 🔒 **نصائح الأمان**

### **1. لا تكشف API Key أبداً:**
- ❌ **لا** تُضيف `.env.local` إلى Git
- ❌ **لا** تنشر الـ Key في الكود
- ❌ **لا** تُشاركه على GitHub/Discord/etc

### **2. راقب الاستخدام:**
1. انتقل إلى: **APIs & Services** → **Dashboard**
2. راقب **Quotas** و **Metrics**
3. فعّل **Alerts** للتنبيهات

### **3. قيّد الـ Key:**
- ✅ فقط domains محددة
- ✅ فقط APIs محددة
- ✅ راجع التقييدات شهرياً

---

## 🐛 **حل المشاكل**

### **1. "Google is not defined":**
**السبب:** API Key غير صحيح أو غير موجود

**الحل:**
```bash
# تحقق من وجود الملف
ls -la .env.local

# تحقق من المحتوى
cat .env.local

# أعد تشغيل dev server
npm run dev
```

---

### **2. "This API key is not authorized":**
**السبب:** الـ Key مُقيّد ولا يسمح بـ localhost

**الحل:**
1. انتقل إلى Google Cloud Console
2. **Credentials** → اختر الـ Key
3. تحت **Application restrictions**:
   - أضف `http://localhost:*`
4. **Save**

---

### **3. الخريطة رمادية أو فارغة:**
**السبب:** Maps JavaScript API غير مُفعّل

**الحل:**
1. **APIs & Services** → **Library**
2. ابحث عن "Maps JavaScript API"
3. تأكد أنها **Enabled**

---

### **4. Auto-complete لا يعمل:**
**السبب:** Places API غير مُفعّل

**الحل:**
1. **APIs & Services** → **Library**
2. ابحث عن "Places API"
3. تأكد أنها **Enabled**

---

### **5. خطأ "REQUEST_DENIED":**
**السبب:** الـ Key مُقيّد بشكل خاطئ

**الحل:**
1. افحص **API restrictions**
2. تأكد أن Maps API و Places API مُضافة
3. حاول إزالة التقييدات مؤقتاً للاختبار

---

## 📊 **التحقق من التكاليف**

### **مراقبة الاستخدام:**
```
1. Google Cloud Console
2. Navigation Menu → Billing
3. Cost Table → APIs
4. راقب:
   - Maps JavaScript API
   - Places API
   - Geocoding API
```

### **تفعيل Budget Alerts:**
```
1. Billing → Budgets & alerts
2. Create Budget
3. أدخل الحد (مثلاً $10)
4. فعّل Email alerts
```

---

## ✅ **Checklist النهائي**

قبل النشر إلى Production:

```
☐ API Key موجود في .env.local
☐ .env.local في .gitignore
☐ Maps JavaScript API مُفعّل
☐ Places API مُفعّل
☐ API Key مُقيّد بـ domains
☐ API Key مُقيّد بـ APIs محددة
☐ Budget alerts مُفعّلة
☐ الخريطة تعمل في localhost
☐ Auto-complete يعمل
☐ لا أخطاء في Console
```

---

## 🚀 **الخطوات التالية**

بعد إعداد Google Maps:

1. ✅ اختبر **InteractiveMap** في EditProfile
2. ✅ اختبر **AddressAutocomplete**
3. ✅ اختبر البحث الجغرافي في Services
4. ✅ نشر Cloud Functions
5. ✅ اختبار على Production

---

## 📚 **مصادر إضافية**

- **Google Maps Documentation:** https://developers.google.com/maps/documentation
- **Places API Guide:** https://developers.google.com/maps/documentation/places/web-service/overview
- **Pricing Calculator:** https://mapsplatform.google.com/pricing/
- **Support:** https://issuetracker.google.com/issues?q=componentid:187527

---

**✨ البرنامج جاهز للانطلاق! 🎉**

---

**آخر تحديث:** 5 نوفمبر 2025  
**الحالة:** ✅ جاهز للتطبيق
