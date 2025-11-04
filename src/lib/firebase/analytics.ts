import { logEvent } from 'firebase/analytics';
import { analytics } from '@/integrations/firebase/client';

// تتبع البحث عن الخدمات
export const trackServiceSearch = (searchTerm: string, category?: string) => {
  if (!analytics) return;
  
  logEvent(analytics, 'search', {
    search_term: searchTerm,
    category: category || 'all'
  });
};

// تتبع عرض صفحة خدمة
export const trackServiceView = (serviceId: string, serviceName: string, providerId: string) => {
  if (!analytics) return;
  
  logEvent(analytics, 'view_item', {
    item_id: serviceId,
    item_name: serviceName,
    item_category: 'service',
    provider_id: providerId
  });
};

// تتبع إنشاء حجز
export const trackBookingCreated = (serviceId: string, providerId: string, bookingDate: string) => {
  if (!analytics) return;
  
  logEvent(analytics, 'booking_created', {
    service_id: serviceId,
    provider_id: providerId,
    booking_date: bookingDate,
    currency: 'AED' // أو العملة المناسبة
  });
};

// تتبع تأكيد حجز
export const trackBookingConfirmed = (bookingId: string) => {
  if (!analytics) return;
  
  logEvent(analytics, 'booking_confirmed', {
    booking_id: bookingId
  });
};

// تتبع إلغاء حجز
export const trackBookingCancelled = (bookingId: string, cancelledBy: 'customer' | 'provider') => {
  if (!analytics) return;
  
  logEvent(analytics, 'booking_cancelled', {
    booking_id: bookingId,
    cancelled_by: cancelledBy
  });
};

// تتبع إضافة تقييم
export const trackReviewSubmitted = (serviceId: string, rating: number, hasComment: boolean) => {
  if (!analytics) return;
  
  logEvent(analytics, 'review_submitted', {
    service_id: serviceId,
    rating: rating,
    has_comment: hasComment
  });
};

// تتبع تسجيل الدخول
export const trackUserLogin = (method: 'email' | 'google', userType: 'provider' | 'customer') => {
  if (!analytics) return;
  
  logEvent(analytics, 'login', {
    method: method,
    user_type: userType
  });
};

// تتبع التسجيل
export const trackUserSignup = (method: 'email' | 'google', userType: 'provider' | 'customer') => {
  if (!analytics) return;
  
  logEvent(analytics, 'sign_up', {
    method: method,
    user_type: userType
  });
};

// تتبع عرض صفحة مزود الخدمة
export const trackProviderProfileView = (providerId: string, providerName: string) => {
  if (!analytics) return;
  
  logEvent(analytics, 'view_provider_profile', {
    provider_id: providerId,
    provider_name: providerName
  });
};

// تتبع مشاركة الملف الشخصي
export const trackProfileShare = (providerId: string, method: 'qr' | 'link') => {
  if (!analytics) return;
  
  logEvent(analytics, 'share_profile', {
    provider_id: providerId,
    share_method: method
  });
};

// تتبع إضافة خدمة جديدة
export const trackServiceCreated = (serviceId: string, categoryId: string) => {
  if (!analytics) return;
  
  logEvent(analytics, 'service_created', {
    service_id: serviceId,
    category_id: categoryId
  });
};

// تتبع تحديث خدمة
export const trackServiceUpdated = (serviceId: string) => {
  if (!analytics) return;
  
  logEvent(analytics, 'service_updated', {
    service_id: serviceId
  });
};

// تتبع حذف خدمة
export const trackServiceDeleted = (serviceId: string) => {
  if (!analytics) return;
  
  logEvent(analytics, 'service_deleted', {
    service_id: serviceId
  });
};

// تتبع النقر على رقم الهاتف
export const trackPhoneClick = (providerId: string, contactType: 'phone' | 'whatsapp') => {
  if (!analytics) return;
  
  logEvent(analytics, 'contact_provider', {
    provider_id: providerId,
    contact_type: contactType
  });
};

// تتبع تغيير اللغة
export const trackLanguageChange = (fromLang: string, toLang: string) => {
  if (!analytics) return;
  
  logEvent(analytics, 'language_changed', {
    from_language: fromLang,
    to_language: toLang
  });
};

// تتبع الأخطاء
export const trackError = (errorType: string, errorMessage: string, page?: string) => {
  if (!analytics) return;
  
  logEvent(analytics, 'error_occurred', {
    error_type: errorType,
    error_message: errorMessage,
    page: page || 'unknown'
  });
};
