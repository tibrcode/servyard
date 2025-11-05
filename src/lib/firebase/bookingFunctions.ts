// Booking Firebase Functions
// دوال Firebase للحجوزات

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { 
  Booking, 
  ServiceSchedule, 
  BookingStatus,
  DayOfWeek 
} from '@/types/booking';

// Collection references
const bookingsCollection = collection(db, 'bookings');
const schedulesCollection = collection(db, 'service_schedules');

/**
 * Create a new booking
 * إنشاء حجز جديد
 */
export async function createBooking(
  bookingData: Omit<Booking, 'booking_id' | 'created_at' | 'updated_at'>
): Promise<string> {
  const now = Timestamp.now();
  
  const newBooking = {
    ...bookingData,
    created_at: now,
    updated_at: now
  };

  const docRef = await addDoc(bookingsCollection, newBooking);
  
  // Update document with its own ID
  await updateDoc(docRef, {
    booking_id: docRef.id
  });

  return docRef.id;
}

/**
 * Get booking by ID
 * الحصول على حجز بالمعرف
 */
export async function getBooking(bookingId: string): Promise<Booking | null> {
  const docRef = doc(db, 'bookings', bookingId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as Booking;
  }
  
  return null;
}

/**
 * Get all bookings for a service on a specific date
 * الحصول على جميع حجوزات خدمة في تاريخ محدد
 */
export async function getServiceBookings(
  serviceId: string,
  date: string
): Promise<Booking[]> {
  const q = query(
    bookingsCollection,
    where('service_id', '==', serviceId),
    where('booking_date', '==', date),
    orderBy('start_time', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Booking);
}

/**
 * Get all bookings for a provider
 * الحصول على جميع حجوزات مزود الخدمة
 */
export async function getProviderBookings(
  providerId: string,
  startDate?: string,
  endDate?: string
): Promise<Booking[]> {
  let q = query(
    bookingsCollection,
    where('provider_id', '==', providerId),
    orderBy('booking_date', 'desc'),
    orderBy('start_time', 'desc')
  );

  // Note: Firestore doesn't support range queries with OR,
  // so we'll filter in memory if date range is provided
  const snapshot = await getDocs(q);
  let bookings = snapshot.docs.map(doc => doc.data() as Booking);

  // Filter by date range if provided
  if (startDate && endDate) {
    bookings = bookings.filter(
      booking => booking.booking_date >= startDate && booking.booking_date <= endDate
    );
  }

  return bookings;
}

/**
 * Get all bookings for a customer
 * الحصول على جميع حجوزات العميل
 */
export async function getCustomerBookings(customerId: string): Promise<Booking[]> {
  const q = query(
    bookingsCollection,
    where('customer_id', '==', customerId),
    orderBy('booking_date', 'desc'),
    orderBy('start_time', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Booking);
}

/**
 * Update booking status
 * تحديث حالة الحجز
 */
export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
  cancellationReason?: string
): Promise<void> {
  const docRef = doc(db, 'bookings', bookingId);
  
  const updateData: any = {
    status,
    updated_at: Timestamp.now()
  };

  if (cancellationReason) {
    updateData.cancellation_reason = cancellationReason;
  }

  await updateDoc(docRef, updateData);
}

/**
 * Cancel booking
 * إلغاء الحجز
 */
export async function cancelBooking(
  bookingId: string,
  reason: string
): Promise<void> {
  await updateBookingStatus(bookingId, 'cancelled', reason);
}

/**
 * Delete booking
 * حذف الحجز
 */
export async function deleteBooking(bookingId: string): Promise<void> {
  const docRef = doc(db, 'bookings', bookingId);
  await deleteDoc(docRef);
}

// ============================================
// Service Schedule Functions
// دوال جدول الخدمة
// ============================================

/**
 * Create service schedule for a day
 * إنشاء جدول خدمة ليوم
 */
export async function createServiceSchedule(
  scheduleData: Omit<ServiceSchedule, 'schedule_id' | 'created_at' | 'updated_at'>
): Promise<string> {
  const now = Timestamp.now();
  
  const newSchedule = {
    ...scheduleData,
    created_at: now,
    updated_at: now
  };

  const docRef = await addDoc(schedulesCollection, newSchedule);
  
  await updateDoc(docRef, {
    schedule_id: docRef.id
  });

  return docRef.id;
}

/**
 * Get schedule for a service on a specific day
 * الحصول على جدول خدمة ليوم محدد
 */
export async function getServiceSchedule(
  serviceId: string,
  dayOfWeek: DayOfWeek
): Promise<ServiceSchedule | null> {
  const q = query(
    schedulesCollection,
    where('service_id', '==', serviceId),
    where('day_of_week', '==', dayOfWeek)
  );

  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data() as ServiceSchedule;
}

/**
 * Get all schedules for a service
 * الحصول على جميع جداول الخدمة
 */
export async function getAllServiceSchedules(serviceId: string): Promise<ServiceSchedule[]> {
  const q = query(
    schedulesCollection,
    where('service_id', '==', serviceId),
    orderBy('day_of_week', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as ServiceSchedule);
}

/**
 * Update service schedule
 * تحديث جدول الخدمة
 */
export async function updateServiceSchedule(
  scheduleId: string,
  updates: Partial<ServiceSchedule>
): Promise<void> {
  const docRef = doc(db, 'service_schedules', scheduleId);
  
  await updateDoc(docRef, {
    ...updates,
    updated_at: Timestamp.now()
  });
}

/**
 * Delete service schedule
 * حذف جدول الخدمة
 */
export async function deleteServiceSchedule(scheduleId: string): Promise<void> {
  const docRef = doc(db, 'service_schedules', scheduleId);
  await deleteDoc(docRef);
}

/**
 * Bulk create schedules (copy to multiple days)
 * إنشاء جداول متعددة (نسخ لأيام متعددة)
 */
export async function bulkCreateSchedules(
  serviceId: string,
  providerId: string,
  daysOfWeek: DayOfWeek[],
  startTime: string,
  endTime: string,
  breakTimes: ServiceSchedule['break_times']
): Promise<void> {
  const batch = writeBatch(db);
  const now = Timestamp.now();

  for (const dayOfWeek of daysOfWeek) {
    const scheduleRef = doc(schedulesCollection);
    
    batch.set(scheduleRef, {
      schedule_id: scheduleRef.id,
      service_id: serviceId,
      provider_id: providerId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      break_times: breakTimes,
      is_active: true,
      created_at: now,
      updated_at: now
    });
  }

  await batch.commit();
}
