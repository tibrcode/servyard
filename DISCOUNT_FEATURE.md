# ميزة عروض التخفيض للخدمات / Service Discount Feature

## نظرة عامة / Overview

تم إضافة ميزة عروض التخفيض التي تسمح لمزودي الخدمات بإضافة تخفيضات على خدماتهم. تظهر العروض بشكل احترافي على:
- بطاقات الخدمات في صفحة الخدمات
- بطاقات الخدمات في الخريطة التفاعلية
- لوحة تحكم المزود

A discount feature has been added allowing service providers to add discounts to their services. Discounts appear professionally on:
- Service cards in the Services page
- Service cards in the interactive map
- Provider dashboard

---

## الحقول الجديدة / New Fields

تم إضافة الحقول التالية إلى نموذج `Service`:

```typescript
interface Service {
  // ... existing fields
  has_discount?: boolean;           // هل يوجد تخفيض؟
  discount_price?: string;          // السعر بعد التخفيض
  discount_percentage?: number;     // نسبة التخفيض (%)
}
```

---

## الواجهات المحدثة / Updated Interfaces

### 1. إضافة خدمة جديدة / Add New Service
**الملف / File:** `src/pages/AddService.tsx`

**الميزات / Features:**
- قسم جديد لإدخال عرض التخفيض مع تصميم جذاب
- مفتاح تبديل (Switch) لتفعيل/إلغاء التخفيض
- حقل إدخال السعر بعد التخفيض
- حقل إدخال نسبة التخفيض
- عرض السعر الأصلي للمقارنة

```tsx
// Example usage in form:
<Switch
  checked={formData.hasDiscount}
  onCheckedChange={(checked) => setFormData(prev => ({ 
    ...prev, 
    hasDiscount: checked
  }))}
/>

{formData.hasDiscount && (
  <Input
    value={formData.discountPrice}
    placeholder="السعر بعد التخفيض"
  />
)}
```

### 2. تعديل خدمة موجودة / Edit Existing Service
**الملف / File:** `src/pages/EditService.tsx`

**الميزات / Features:**
- نفس واجهة إضافة الخدمة
- تحميل القيم الحالية للتخفيض
- حفظ التحديثات في قاعدة البيانات

### 3. صفحة الخدمات / Services Page
**الملف / File:** `src/pages/Services.tsx`

**التحديثات / Updates:**

#### عرض القائمة / List View:
```tsx
{service.has_discount && service.discount_price ? (
  <>
    {/* السعر بعد التخفيض بالأحمر */}
    <div style={{ color: '#dc2626', fontSize: '18px', fontWeight: '700' }}>
      {service.discount_price} {currency}
      {/* Badge نسبة التخفيض */}
      <Badge variant="destructive">-{service.discount_percentage}%</Badge>
    </div>
    {/* السعر الأصلي مشطوب */}
    <div style={{ textDecoration: 'line-through' }}>
      {service.approximate_price} {currency}
    </div>
  </>
) : (
  {/* السعر العادي */}
)}
```

#### عرض الخريطة / Map View:
- التخفيضات تظهر في popup الخريطة
- السعر الأصلي مشطوب باللون الرمادي
- السعر الجديد بالأحمر
- Badge التخفيض بجانب السعر

### 4. لوحة تحكم المزود / Provider Dashboard
**الملف / File:** `src/components/provider/ServiceManagement.tsx`

**التحديثات / Updates:**
- عرض السعر المخفض بتصميم مميز
- السعر الأصلي مشطوب
- Badge نسبة التخفيض
- ألوان واضحة للتمييز

```tsx
{service.has_discount && service.discount_price ? (
  <div className="flex items-center gap-2">
    <span className="bg-red-50 text-red-600 font-semibold">
      {service.discount_price}
    </span>
    <span className="line-through text-muted-foreground">
      {service.approximate_price}
    </span>
    <Badge className="bg-red-500">-{service.discount_percentage}%</Badge>
  </div>
) : (
  <span>{service.approximate_price}</span>
)}
```

---

## قاعدة البيانات / Database

### Firestore Schema Update

تأكد من أن مجموعة `services` تدعم الحقول التالية:

```javascript
{
  // ... existing fields
  has_discount: boolean,        // optional
  discount_price: string,       // optional
  discount_percentage: number   // optional
}
```

**ملاحظة:** الحقول اختيارية ولن تؤثر على الخدمات الموجودة.

---

## التصميم / Design

### الألوان المستخدمة / Colors Used:

- **السعر المخفض / Discounted Price:** `#dc2626` (أحمر)
- **Badge التخفيض / Discount Badge:** `bg-red-500` (أحمر غامق)
- **السعر الأصلي / Original Price:** مشطوب باللون الرمادي

### المكونات / Components:

- **Switch** من shadcn/ui لتفعيل التخفيض
- **Badge** لعرض نسبة التخفيض
- **Input** لإدخال القيم
- تصميم متجاوب (Responsive) يعمل على جميع الأحجام

---

## كيفية الاستخدام / How to Use

### للمزود / For Providers:

1. انتقل إلى صفحة إضافة خدمة أو تعديل خدمة
2. في قسم التسعير، قم بتفعيل مفتاح "عرض تخفيض"
3. أدخل السعر الجديد بعد التخفيض
4. أدخل نسبة التخفيض (اختياري)
5. احفظ التغييرات

### للعملاء / For Customers:

- التخفيضات تظهر تلقائياً على جميع بطاقات الخدمات
- السعر القديم يظهر مشطوباً للمقارنة
- Badge التخفيض يسهل التعرف على العروض

---

## الملفات المحدثة / Updated Files

1. ✅ `src/lib/servicesCache.ts` - إضافة حقول التخفيض للـ interface
2. ✅ `src/pages/AddService.tsx` - واجهة إضافة التخفيض
3. ✅ `src/pages/EditService.tsx` - واجهة تعديل التخفيض
4. ✅ `src/pages/Services.tsx` - عرض التخفيضات في القائمة والتفاصيل
5. ✅ `src/components/map/InteractiveMap.tsx` - عرض التخفيضات في الخريطة
6. ✅ `src/components/provider/ServiceManagement.tsx` - عرض التخفيضات في لوحة المزود
7. ✅ `src/pages/ProviderDashboard.tsx` - تحديث interface

---

## الميزات الإضافية / Additional Features

### فصل قسم العروض / Separated Offers Section

تم بالفعل فصل قسم "العروض" عن "الخدمات" في صفحة الخدمات باستخدام:
- **Tabs** للتنقل بين الخدمات والعروض
- العروض تظهر في تبويب منفصل
- التخفيضات على الخدمات تظهر مباشرة في بطاقة الخدمة

---

## الاختبار / Testing

### سيناريوهات الاختبار / Test Scenarios:

1. ✅ إضافة خدمة جديدة مع تخفيض
2. ✅ إضافة خدمة جديدة بدون تخفيض
3. ✅ تعديل خدمة موجودة لإضافة تخفيض
4. ✅ تعديل خدمة موجودة لإزالة تخفيض
5. ✅ عرض الخدمات المخفضة في القائمة
6. ✅ عرض الخدمات المخفضة في الخريطة
7. ✅ عرض الخدمات المخفضة في لوحة المزود

---

## الملاحظات / Notes

- جميع حقول التخفيض اختيارية (optional)
- لن تتأثر الخدمات الموجودة
- التخفيض يظهر فقط عندما يكون `has_discount = true`
- يمكن إضافة نسبة التخفيض فقط أو السعر المخفض فقط أو كلاهما
- التصميم متجاوب ويعمل على الجوال والكمبيوتر

---

## الدعم / Support

في حالة وجود أي مشاكل أو استفسارات، يرجى التواصل مع فريق التطوير.

For any issues or questions, please contact the development team.

---

**تاريخ الإنشاء / Creation Date:** 20 نوفمبر 2025
**الإصدار / Version:** 1.0.0
