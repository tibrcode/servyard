# نظام المفضلة (Favorites System)

## نظرة عامة (Overview)
تم تطوير نظام شامل للمفضلة يسمح للعملاء بحفظ الخدمات ومزودي الخدمة المفضلين لديهم.

A comprehensive favorites system has been implemented that allows customers to save their favorite services and service providers.

## الميزات المنفذة (Implemented Features)

### 1. أنواع البيانات (Data Types)
- ملف: `src/types/favorites.ts`
- أنواع:
  - `FavoriteType`: 'service' | 'provider'
  - `Favorite`: يحتوي على user_id, type, item_id, وبيانات مخزنة مؤقتًا (cached data)
  - البيانات المخزنة: title, image, category, rating, location

### 2. دوال Firebase (Firebase Functions)
- ملف: `src/lib/firebase/favoriteFunctions.ts`
- الدوال:
  - `addFavorite()` - إضافة إلى المفضلة
  - `removeFavorite()` - إزالة من المفضلة
  - `isFavorite()` - التحقق من وجود عنصر في المفضلة
  - `getUserFavorites()` - جلب جميع المفضلات
  - `getUserFavoritesByType()` - جلب المفضلات حسب النوع (خدمات أو مزودين)
  - `toggleFavorite()` - إضافة/إزالة تلقائية
  - `invalidateFavoritesCache()` - تحديث الكاش

### 3. صفحة المفضلة (Favorites Page)
- ملف: `src/pages/Favorites.tsx`
- الميزات:
  - تبويبات (Tabs) للخدمات ومزودي الخدمة
  - عرض شبكي متجاوب (responsive grid)
  - حالات فارغة (empty states) عندما لا توجد مفضلات
  - زر إزالة لكل عنصر
  - تنقل إلى تفاصيل الخدمة/المزود
  - رسائل تحميل (loading states)

### 4. زر المفضلة (FavoriteButton Component)
- ملف: `src/components/common/FavoriteButton.tsx`
- الميزات:
  - أيقونة قلب مع رسوم متحركة
  - حالات: checking, loading, active
  - إشعارات توست (toast notifications)
  - التحقق من تسجيل الدخول
  - قابل لإعادة الاستخدام (reusable)
  - خيارات: variant, size, showLabel

### 5. التكامل (Integration)

#### Services Page (صفحة الخدمات)
- إضافة زر في بطاقات الخدمات (grid cards)
- إضافة زر في بطاقة تفاصيل الخدمة المحددة
- موضع الزر: أعلى اليسار (معاكس لشارة TOP)

#### Provider Profile (ملف مزود الخدمة)
- إضافة زر بجانب اسم المزود
- يحفظ البيانات: الاسم، الصورة، التقييم، الموقع

#### Navigation (التنقل)
- إضافة عنصر "المفضلة" في AppSidebar
- أيقونة القلب (Heart icon)
- نصوص ثنائية اللغة (Bilingual labels)
- المسار: `/favorites`
- محمي للعملاء فقط (Protected - customers only)

### 6. Firebase Collection
```typescript
Collection: 'favorites'
Structure:
{
  user_id: string          // معرف المستخدم
  type: 'service' | 'provider'  // نوع العنصر
  item_id: string          // معرف الخدمة أو المزود
  title?: string           // العنوان (مخزن مؤقتًا)
  image?: string           // صورة (مخزنة مؤقتًا)
  category?: string        // الفئة (للخدمات)
  rating?: number          // التقييم
  location?: string        // الموقع (للمزودين)
  created_at: Timestamp    // تاريخ الإنشاء
}
```

#### Indexes Required
```
user_id (ASC)
item_id (ASC)
type (ASC)
user_id + type (Compound)
```

## الملفات المعدلة (Modified Files)
1. ✅ `src/types/favorites.ts` - NEW
2. ✅ `src/lib/firebase/favoriteFunctions.ts` - NEW
3. ✅ `src/pages/Favorites.tsx` - NEW
4. ✅ `src/components/common/FavoriteButton.tsx` - NEW
5. ✅ `src/App.tsx` - Added route
6. ✅ `src/components/layout/AppSidebar.tsx` - Added menu item
7. ✅ `src/pages/Services.tsx` - Integrated button
8. ✅ `src/pages/ProviderProfile.tsx` - Integrated button

## كيفية الاستخدام (How to Use)

### للعملاء (For Customers)
1. تسجيل الدخول كعميل
2. تصفح الخدمات أو ملفات المزودين
3. انقر على أيقونة القلب لإضافة إلى المفضلة
4. افتح صفحة "المفضلة" من القائمة الجانبية
5. تصفح المفضلات في التبويبات (خدمات/مزودين)
6. انقر على "عرض التفاصيل" للانتقال إلى الصفحة
7. انقر على "إزالة" لحذف من المفضلة

### للمطورين (For Developers)
```tsx
// استخدام زر المفضلة
<FavoriteButton
  type="service"  // or "provider"
  itemId={service.id}
  itemData={{
    title: service.name,
    category: category.name,
    rating: 4.5
  }}
  variant="ghost"
  size="sm"
/>

// جلب المفضلات
const favorites = await getUserFavoritesByType(userId, 'service');

// إضافة/إزالة
await toggleFavorite(userId, 'service', serviceId, serviceData);
```

## التحسينات المستقبلية (Future Enhancements)
- [ ] مزامنة المفضلات عبر الأجهزة
- [ ] مشاركة قائمة المفضلات
- [ ] تصدير المفضلات
- [ ] إشعارات عند تحديث الخدمات المفضلة
- [ ] ترتيب المفضلات حسب التفضيل
- [ ] إضافة ملاحظات للمفضلات

## الاختبار (Testing)
✅ Dev server running at http://localhost:8080
✅ No TypeScript errors
✅ Responsive design working
✅ Bilingual support (EN/AR)
✅ Authentication check working
✅ Toast notifications working

## الدعم (Support)
- البيئة: Vite + React + TypeScript
- قاعدة البيانات: Firebase Firestore
- المصادقة: Firebase Authentication
- الواجهة: shadcn/ui + Tailwind CSS
- الأيقونات: lucide-react

---
تاريخ التنفيذ: December 2024
الحالة: ✅ مكتمل (Completed)
