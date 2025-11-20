// Types for Booking System
// أنواع نظام الحجوزات

import { Timestamp } from 'firebase/firestore';

/**
 * Booking Status
 * حالة الحجز
 */
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';

/**
 * Day of Week (0 = Sunday, 6 = Saturday)
 * يوم الأسبوع (0 = الأحد، 6 = السبت)
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Break Time Period
 * فترة راحة
 */
export interface BreakTime {
  start: string; // HH:mm format (e.g., "13:00")
  end: string;   // HH:mm format (e.g., "14:00")
}

/**
 * Service Schedule - Weekly schedule for a service
 * جدول الخدمة - الجدول الأسبوعي للخدمة
 */
export interface ServiceSchedule {
  schedule_id: string;
  service_id: string;
  provider_id: string;
  day_of_week: DayOfWeek;
  start_time: string;      // HH:mm format (e.g., "09:00")
  end_time: string;        // HH:mm format (e.g., "21:00")
  break_times: BreakTime[];
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

/**
 * Booking - Single appointment booking
 * الحجز - موعد واحد
 */
export interface Booking {
  booking_id: string;
  service_id: string;
  provider_id: string;
  customer_id: string;
  customer_name?: string;      // Cached for performance
  customer_phone?: string;     // Cached for performance
  service_title?: string;      // Cached for performance
  booking_date: string;        // YYYY-MM-DD format
  start_time: string;          // HH:mm format
  end_time: string;            // HH:mm format (calculated from duration)
  status: BookingStatus;
  price: number;
  currency: string;
  notes?: string;
  cancellation_reason?: string;
  cancellation_policy_hours?: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

/**
 * Time Slot - Computed availability for a specific time
 * الفترة الزمنية - التوفر المحسوب لوقت محدد
 */
export interface TimeSlot {
  time: string;                // HH:mm format
  datetime: Date;              // Full date + time
  available: boolean;
  booked: number;              // Number of bookings
  capacity: number;            // Max concurrent bookings
  bookings?: Booking[];        // Existing bookings (optional)
}

/**
 * Daily Availability - All time slots for a specific date
 * التوفر اليومي - جميع الفترات الزمنية لتاريخ محدد
 */
export interface DailyAvailability {
  date: string;                // YYYY-MM-DD format
  day_of_week: DayOfWeek;
  is_available: boolean;       // Has any available slots
  slots: TimeSlot[];
}

/**
 * Booking Settings - Extended service fields for booking
 * إعدادات الحجز - حقول إضافية للخدمة
 */
export interface BookingSettings {
  booking_enabled: boolean;              // Enable/disable booking
  duration_minutes: number;              // Service duration (15, 30, 60, 90, etc.)
  max_concurrent_bookings: number;       // Number of parallel slots (e.g., 3 barbers)
  advance_booking_days: number;          // How many days ahead can book (e.g., 30)
  cancellation_policy_hours: number;     // Hours before appointment to cancel (e.g., 24)
  require_confirmation: boolean;         // Provider must confirm booking
  allow_customer_cancellation: boolean;  // Customer can cancel
  buffer_time_minutes?: number;          // Gap between appointments (e.g., 10 min)
}

/**
 * Booking Statistics - For provider dashboard
 * إحصائيات الحجوزات - للوحة التحكم
 */
export interface BookingStatistics {
  total_bookings: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  completed: number;
  no_show: number;
  total_revenue: number;
  currency: string;
  period: 'today' | 'week' | 'month' | 'all';
}
