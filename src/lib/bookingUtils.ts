// Booking Utility Functions
// دوال مساعدة لنظام الحجوزات

import { 
  Booking, 
  ServiceSchedule, 
  TimeSlot, 
  DailyAvailability, 
  DayOfWeek,
  BreakTime,
  BookingSettings 
} from '@/types/booking';

/**
 * Parse time string to minutes since midnight
 * تحويل الوقت إلى دقائق من منتصف الليل
 * @example "09:30" => 570
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes to time string
 * تحويل الدقائق إلى وقت
 * @example 570 => "09:30"
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Get day of week from date string
 * الحصول على يوم الأسبوع من التاريخ
 * @example "2025-11-05" => 2 (Tuesday)
 */
export function getDayOfWeek(dateString: string): DayOfWeek {
  const date = new Date(dateString);
  return date.getDay() as DayOfWeek;
}

/**
 * Format date to YYYY-MM-DD
 * تنسيق التاريخ
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if time is within a break period
 * التحقق من كون الوقت ضمن فترة راحة
 */
export function isInBreakTime(time: string, breakTimes: BreakTime[]): boolean {
  const timeMinutes = timeToMinutes(time);
  
  return breakTimes.some(breakTime => {
    const breakStart = timeToMinutes(breakTime.start);
    const breakEnd = timeToMinutes(breakTime.end);
    return timeMinutes >= breakStart && timeMinutes < breakEnd;
  });
}

/**
 * Check if booking overlaps with a time slot
 * التحقق من تداخل الحجز مع فترة زمنية
 */
export function bookingOverlapsSlot(
  booking: Booking,
  slotTime: string,
  durationMinutes: number
): boolean {
  const slotStart = timeToMinutes(slotTime);
  const slotEnd = slotStart + durationMinutes;
  const bookingStart = timeToMinutes(booking.start_time);
  const bookingEnd = timeToMinutes(booking.end_time);

  // Check for overlap
  return bookingStart < slotEnd && bookingEnd > slotStart;
}

/**
 * Generate all time slots for a schedule
 * إنشاء جميع الفترات الزمنية للجدول
 */
export function generateTimeSlots(
  schedule: ServiceSchedule,
  durationMinutes: number,
  bufferMinutes: number = 0
): string[] {
  const slots: string[] = [];
  const startMinutes = timeToMinutes(schedule.start_time);
  const endMinutes = timeToMinutes(schedule.end_time);
  const slotInterval = durationMinutes + bufferMinutes;

  let currentMinutes = startMinutes;

  while (currentMinutes + durationMinutes <= endMinutes) {
    const timeString = minutesToTime(currentMinutes);
    
    // Skip if in break time
    if (!isInBreakTime(timeString, schedule.break_times)) {
      slots.push(timeString);
    }
    
    currentMinutes += slotInterval;
  }

  return slots;
}

/**
 * Calculate available time slots for a specific date
 * حساب الفترات الزمنية المتاحة لتاريخ محدد
 */
export function calculateAvailableSlots(
  date: string,
  schedule: ServiceSchedule | null,
  bookings: Booking[],
  settings: BookingSettings,
  providerTimezone: string = 'Asia/Dubai'
): TimeSlot[] {
  // No schedule for this day
  if (!schedule || !schedule.is_active) {
    return [];
  }

  // Generate all possible time slots
  const timeStrings = generateTimeSlots(
    schedule,
    settings.duration_minutes,
    settings.buffer_time_minutes || 0
  );

  // Get current date and time in provider's timezone for comparison
  const nowInProviderTZ = new Date().toLocaleString('en-US', { timeZone: providerTimezone });
  const now = new Date(nowInProviderTZ);
  const today = formatDate(now);
  const isToday = date === today;

  // Count bookings for each slot
  const slots: TimeSlot[] = timeStrings.map(time => {
    // Create full datetime
    const [hours, minutes] = time.split(':').map(Number);
    const datetime = new Date(date);
    datetime.setHours(hours, minutes, 0, 0);

    // Check if this time slot has already passed (only for today)
    const hasPassed = isToday && datetime < now;

    // Filter bookings that overlap with this slot
    const overlappingBookings = bookings.filter(booking => {
      // Only count confirmed/pending bookings
      if (booking.status === 'cancelled' || booking.status === 'no-show') {
        return false;
      }
      
      return bookingOverlapsSlot(booking, time, settings.duration_minutes);
    });

    const booked = overlappingBookings.length;
    // Slot is unavailable if: it has passed OR it's fully booked
    // الموعد غير متاح إذا: مضى وقته أو ممتلئ بالكامل
    const available = !hasPassed && booked < settings.max_concurrent_bookings;

    return {
      time,
      datetime,
      available,
      booked,
      capacity: settings.max_concurrent_bookings,
      bookings: overlappingBookings
    };
  });

  return slots;
}

/**
 * Get daily availability for a service
 * الحصول على التوفر اليومي للخدمة
 */
export function getDailyAvailability(
  date: string,
  schedule: ServiceSchedule | null,
  bookings: Booking[],
  settings: BookingSettings,
  providerTimezone: string = 'Asia/Dubai'
): DailyAvailability {
  const dayOfWeek = getDayOfWeek(date);
  const slots = calculateAvailableSlots(date, schedule, bookings, settings, providerTimezone);
  const isAvailable = slots.some(slot => slot.available);

  return {
    date,
    day_of_week: dayOfWeek,
    is_available: isAvailable,
    slots
  };
}

/**
 * Check if a date is within advance booking window
 * التحقق من كون التاريخ ضمن نافذة الحجز المسبق
 */
export function isDateBookable(
  date: string,
  advanceBookingDays: number
): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(date);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + advanceBookingDays);

  return targetDate >= today && targetDate <= maxDate;
}

/**
 * Calculate end time from start time and duration
 * حساب وقت النهاية من البداية والمدة
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + durationMinutes;
  return minutesToTime(endMinutes);
}

/**
 * Get day name in Arabic/English
 * الحصول على اسم اليوم
 */
export function getDayName(dayOfWeek: DayOfWeek, language: 'ar' | 'en' = 'ar'): string {
  const daysAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  return language === 'ar' ? daysAr[dayOfWeek] : daysEn[dayOfWeek];
}

/**
 * Format time for display (12-hour format with AM/PM)
 * تنسيق الوقت للعرض
 */
export function formatTimeDisplay(time: string, language: 'ar' | 'en' = 'ar'): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? (language === 'ar' ? 'م' : 'PM') : (language === 'ar' ? 'ص' : 'AM');
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Check if booking can be cancelled based on policy
 * التحقق من إمكانية إلغاء الحجز حسب السياسة
 */
export function canCancelBooking(
  booking: Booking,
  cancellationPolicyHours: number
): boolean {
  if (booking.status !== 'confirmed' && booking.status !== 'pending') {
    return false;
  }

  const bookingDateTime = new Date(`${booking.booking_date}T${booking.start_time}`);
  const now = new Date();
  const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  return hoursUntilBooking >= cancellationPolicyHours;
}

/**
 * Generate date range for calendar
 * إنشاء نطاق تواريخ للتقويم
 */
export function generateDateRange(startDate: Date, days: number): string[] {
  const dates: string[] = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    dates.push(formatDate(date));
  }
  
  return dates;
}
