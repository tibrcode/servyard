/**
 * حساب المسافة بين نقطتين GPS باستخدام Haversine formula
 * Calculate distance between two GPS points using Haversine formula
 * 
 * @param lat1 خط العرض الأول
 * @param lon1 خط الطول الأول
 * @param lat2 خط العرض الثاني
 * @param lon2 خط الطول الثاني
 * @returns المسافة بالكيلومترات
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // نصف قطر الأرض بالكيلومترات / Earth's radius in km
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * تحويل الدرجات إلى راديان
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * تنسيق المسافة للعرض (مع وحدة القياس)
 * Format distance for display (with unit)
 * 
 * @param distance المسافة بالكيلومترات
 * @param language اللغة ('ar' أو 'en')
 * @returns نص منسق مثل "2.5 كم" أو "850 م"
 */
export function formatDistance(distance: number, language: string = 'ar'): string {
  const isRTL = language === 'ar';
  
  if (distance < 1) {
    // أقل من كيلومتر - عرض بالأمتار
    const meters = Math.round(distance * 1000);
    return isRTL ? `${meters} م` : `${meters} m`;
  } else if (distance < 10) {
    // من 1 إلى 10 كم - عرض بخانة عشرية واحدة
    return isRTL ? `${distance.toFixed(1)} كم` : `${distance.toFixed(1)} km`;
  } else {
    // أكثر من 10 كم - عرض بدون خانات عشرية
    return isRTL ? `${Math.round(distance)} كم` : `${Math.round(distance)} km`;
  }
}

/**
 * حساب وتنسيق المسافة مع النص الكامل
 * Calculate and format distance with full text
 * 
 * @param userLat موقع المستخدم - خط العرض
 * @param userLon موقع المستخدم - خط الطول
 * @param targetLat الموقع المستهدف - خط العرض
 * @param targetLon الموقع المستهدف - خط الطول
 * @param language اللغة
 * @returns نص كامل مثل "يبعد 2.5 كم عنك"
 */
export function getDistanceText(
  userLat: number,
  userLon: number,
  targetLat: number,
  targetLon: number,
  language: string = 'ar'
): string {
  const distance = calculateDistance(userLat, userLon, targetLat, targetLon);
  const formattedDistance = formatDistance(distance, language);
  const isRTL = language === 'ar';
  
  return isRTL 
    ? `يبعد ${formattedDistance} عنك`
    : `${formattedDistance} away`;
}

/**
 * التحقق من وجود إحداثيات صالحة
 * Check if coordinates are valid
 */
export function isValidCoordinates(lat?: number | null, lon?: number | null): boolean {
  if (lat === null || lat === undefined || lon === null || lon === undefined) {
    return false;
  }
  
  // التحقق من النطاقات الصحيحة
  // Latitude: -90 to 90, Longitude: -180 to 180
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}
