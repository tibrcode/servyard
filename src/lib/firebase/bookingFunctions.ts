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
  writeBatch,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { withTrace } from '@/lib/trace';
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
  // Remove orderBy to avoid index requirement, sort in JavaScript instead
  const q = query(
    bookingsCollection,
    where('service_id', '==', serviceId),
    where('booking_date', '==', date)
  );

  const snapshot = await getDocs(q);
  const bookings = snapshot.docs.map(doc => doc.data() as Booking);
  
  // Sort by start_time in JavaScript
  return bookings.sort((a, b) => a.start_time.localeCompare(b.start_time));
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
  // Remove orderBy to avoid index requirement, sort in JavaScript instead
  let q = query(
    bookingsCollection,
    where('provider_id', '==', providerId)
  );

  const snapshot = await getDocs(q);
  let bookings = snapshot.docs.map(doc => doc.data() as Booking);

  // Filter by date range if provided
  if (startDate && endDate) {
    bookings = bookings.filter(
      booking => booking.booking_date >= startDate && booking.booking_date <= endDate
    );
  }

  // Sort by booking_date and start_time in JavaScript
  return bookings.sort((a, b) => {
    const dateCompare = b.booking_date.localeCompare(a.booking_date);
    if (dateCompare !== 0) return dateCompare;
    return b.start_time.localeCompare(a.start_time);
  });
}

/**
 * Get all bookings for a customer
 * الحصول على جميع حجوزات العميل
 */
export async function getCustomerBookings(customerId: string): Promise<Booking[]> {
  // Remove orderBy to avoid index requirement, sort in JavaScript instead
  const q = query(
    bookingsCollection,
    where('customer_id', '==', customerId)
  );

  const snapshot = await getDocs(q);
  const bookings = snapshot.docs.map(doc => doc.data() as Booking);
  
  // Sort by booking_date and start_time in JavaScript
  return bookings.sort((a, b) => {
    const dateCompare = b.booking_date.localeCompare(a.booking_date);
    if (dateCompare !== 0) return dateCompare;
    return b.start_time.localeCompare(a.start_time);
  });
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
  
  // Get old booking data before update
  const bookingSnap = await getDoc(docRef);
  const oldBooking = bookingSnap.data();
  const oldStatus = oldBooking?.status;
  
  const updateData: any = {
    status,
    updated_at: Timestamp.now()
  };

  if (cancellationReason) {
    updateData.cancellation_reason = cancellationReason;
  }

  await updateDoc(docRef, updateData);

  // Send notification about status change
  if (oldStatus !== status) {
    try {
      const updatedBooking = { ...oldBooking, ...updateData };
      await fetch('https://notifybookingstatuschange-btfczcxdyq-uc.a.run.app', withTrace({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bookingId,
          booking: updatedBooking,
          oldStatus: oldStatus,
          newStatus: status
        })
      }));
    } catch (notifError) {
      console.error('Error sending status change notification:', notifError);
      // Don't fail the update if notification fails
    }
  }
}

/**
 * Update booking details (date, time, price)
 * تحديث تفاصيل الحجز (التاريخ، الوقت، السعر)
 */
export async function updateBooking(
  bookingId: string,
  updates: Partial<Pick<Booking, 'booking_date' | 'start_time' | 'end_time' | 'price' | 'notes'>>
): Promise<void> {
  const docRef = doc(db, 'bookings', bookingId);
  
  await updateDoc(docRef, {
    ...updates,
    updated_at: Timestamp.now()
  });
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
  // Remove orderBy to avoid index requirement, sort in JavaScript instead
  const q = query(
    schedulesCollection,
    where('service_id', '==', serviceId)
  );

  const snapshot = await getDocs(q);
  const schedules = snapshot.docs.map(doc => doc.data() as ServiceSchedule);
  
  // Sort by day_of_week in JavaScript
  return schedules.sort((a, b) => a.day_of_week - b.day_of_week);
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

/**
 * Subscribe to customer bookings in real-time
 * الاشتراك في حجوزات العميل بشكل فوري
 */
export function subscribeToCustomerBookings(
  customerId: string,
  callback: (bookings: Booking[]) => void
): Unsubscribe {
  const q = query(
    bookingsCollection,
    where('customer_id', '==', customerId)
  );

  return onSnapshot(q, (snapshot) => {
    const bookings = snapshot.docs.map(doc => doc.data() as Booking);
    
    // Sort by booking_date and start_time in JavaScript
    const sorted = bookings.sort((a, b) => {
      const dateCompare = b.booking_date.localeCompare(a.booking_date);
      if (dateCompare !== 0) return dateCompare;
      return b.start_time.localeCompare(a.start_time);
    });
    
    callback(sorted);
  }, (error) => {
    console.error('Error in customer bookings subscription:', error);
  });
}

/**
 * Subscribe to provider bookings in real-time
 * الاشتراك في حجوزات المزود بشكل فوري
 */
export function subscribeToProviderBookings(
  providerId: string,
  callback: (bookings: Booking[]) => void
): Unsubscribe {
  const q = query(
    bookingsCollection,
    where('provider_id', '==', providerId)
  );

  return onSnapshot(q, (snapshot) => {
    const bookings = snapshot.docs.map(doc => doc.data() as Booking);
    
    // Sort by booking_date and start_time in JavaScript
    const sorted = bookings.sort((a, b) => {
      const dateCompare = b.booking_date.localeCompare(a.booking_date);
      if (dateCompare !== 0) return dateCompare;
      return b.start_time.localeCompare(a.start_time);
    });
    
    callback(sorted);
  }, (error) => {
    console.error('Error in provider bookings subscription:', error);
  });
}
