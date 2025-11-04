/**
 * مكتبة حساب المسافات الجغرافية
 * Geographic Distance Calculation Library
 * 
 * يستخدم معادلة Haversine لحساب المسافة بين نقطتين على الكرة الأرضية
 * Uses Haversine formula to calculate distance between two points on Earth
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationWithDistance extends Coordinates {
  distance: number; // بالكيلومتر / in kilometers
}

/**
 * حساب المسافة بين نقطتين جغرافيتين باستخدام معادلة Haversine
 * Calculate distance between two geographic points using Haversine formula
 * 
 * @param point1 - النقطة الأولى (خط العرض والطول)
 * @param point2 - النقطة الثانية (خط العرض والطول)
 * @returns المسافة بالكيلومتر / Distance in kilometers
 */
export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  const R = 6371; // نصف قطر الأرض بالكيلومتر / Earth's radius in km

  const lat1Rad = toRadians(point1.latitude);
  const lat2Rad = toRadians(point2.latitude);
  const deltaLatRad = toRadians(point2.latitude - point1.latitude);
  const deltaLonRad = toRadians(point2.longitude - point1.longitude);

  // معادلة Haversine
  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLonRad / 2) *
      Math.sin(deltaLonRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // المسافة بالكيلومتر
}

/**
 * التحقق من أن النقطة ضمن نطاق معين
 * Check if a point is within a certain radius
 * 
 * @param userLocation - موقع المستخدم
 * @param targetLocation - الموقع المستهدف
 * @param radiusKm - النطاق بالكيلومتر
 * @returns true إذا كانت ضمن النطاق
 */
export function isWithinRadius(
  userLocation: Coordinates,
  targetLocation: Coordinates,
  radiusKm: number
): boolean {
  const distance = calculateDistance(userLocation, targetLocation);
  return distance <= radiusKm;
}

/**
 * ترتيب قائمة من المواقع حسب المسافة من موقع المستخدم
 * Sort a list of locations by distance from user location
 * 
 * @param userLocation - موقع المستخدم
 * @param locations - قائمة المواقع مع البيانات الإضافية
 * @returns قائمة مرتبة حسب الأقرب
 */
export function sortByDistance<T extends Coordinates>(
  userLocation: Coordinates,
  locations: T[]
): (T & { distance: number })[] {
  return locations
    .map(location => ({
      ...location,
      distance: calculateDistance(userLocation, location)
    }))
    .sort((a, b) => a.distance - b.distance);
}

/**
 * فلترة المواقع حسب النطاق الجغرافي
 * Filter locations by geographic radius
 * 
 * @param userLocation - موقع المستخدم
 * @param locations - قائمة المواقع
 * @param radiusKm - النطاق بالكيلومتر
 * @returns قائمة المواقع ضمن النطاق مع المسافات
 */
export function filterByRadius<T extends Coordinates>(
  userLocation: Coordinates,
  locations: T[],
  radiusKm: number
): (T & { distance: number })[] {
  return locations
    .map(location => ({
      ...location,
      distance: calculateDistance(userLocation, location)
    }))
    .filter(location => location.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
}

/**
 * تحويل الدرجات إلى راديان
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * تنسيق المسافة للعرض (مع الوحدة المناسبة)
 * Format distance for display (with appropriate unit)
 * 
 * @param distanceKm - المسافة بالكيلومتر
 * @param language - اللغة (en أو ar)
 * @returns نص منسق للعرض
 */
export function formatDistance(distanceKm: number, language: 'en' | 'ar' = 'en'): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return language === 'ar' ? `${meters} متر` : `${meters}m`;
  } else if (distanceKm < 10) {
    return language === 'ar' 
      ? `${distanceKm.toFixed(1)} كم` 
      : `${distanceKm.toFixed(1)} km`;
  } else {
    return language === 'ar' 
      ? `${Math.round(distanceKm)} كم` 
      : `${Math.round(distanceKm)} km`;
  }
}

/**
 * الحصول على حدود المنطقة الجغرافية (bounding box)
 * Get geographic bounding box for a location and radius
 * يستخدم للبحث السريع في Firestore
 * Used for quick Firestore queries
 * 
 * @param center - المركز
 * @param radiusKm - النطاق بالكيلومتر
 * @returns حدود المنطقة (شمال، جنوب، شرق، غرب)
 */
export function getBoundingBox(
  center: Coordinates,
  radiusKm: number
): {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
} {
  const latDelta = radiusKm / 111; // تقريباً 111 كم لكل درجة خط عرض
  const lonDelta = radiusKm / (111 * Math.cos(toRadians(center.latitude)));

  return {
    minLat: center.latitude - latDelta,
    maxLat: center.latitude + latDelta,
    minLon: center.longitude - lonDelta,
    maxLon: center.longitude + lonDelta
  };
}

/**
 * التحقق من صحة الإحداثيات
 * Validate coordinates
 */
export function isValidCoordinates(coords: Partial<Coordinates>): coords is Coordinates {
  return (
    typeof coords.latitude === 'number' &&
    typeof coords.longitude === 'number' &&
    coords.latitude >= -90 &&
    coords.latitude <= 90 &&
    coords.longitude >= -180 &&
    coords.longitude <= 180 &&
    !isNaN(coords.latitude) &&
    !isNaN(coords.longitude)
  );
}

/**
 * الخيارات المتاحة للنطاق (للـ UI)
 * Available radius options (for UI)
 */
export const RADIUS_OPTIONS = [
  { value: 5, label: { en: '5 km', ar: '5 كم' } },
  { value: 10, label: { en: '10 km', ar: '10 كم' } },
  { value: 25, label: { en: '25 km', ar: '25 كم' } },
  { value: 50, label: { en: '50 km', ar: '50 كم' } },
  { value: 100, label: { en: '100 km', ar: '100 كم' } },
  { value: 500, label: { en: '500 km', ar: '500 كم' } },
  { value: 0, label: { en: 'Any distance', ar: 'أي مسافة' } }
] as const;

/**
 * النطاق الافتراضي
 * Default radius
 */
export const DEFAULT_RADIUS_KM = 25;
