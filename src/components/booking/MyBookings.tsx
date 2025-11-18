// My Bookings Component - Customer's bookings list
// مكون حجوزاتي - قائمة حجوزات العميل

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Booking, BookingStatus, BookingSettings } from '@/types/booking';
import { getCustomerBookings, cancelBooking, subscribeToCustomerBookings } from '@/lib/firebase/bookingFunctions';
import { formatTimeDisplay, canCancelBooking } from '@/lib/bookingUtils';
import { Calendar, Clock, MapPin, Phone, X, AlertCircle, CheckCircle2, Star, Edit, MessageSquare, Navigation } from 'lucide-react';
import { calculateDistance, formatDistance } from '@/lib/geolocation';
import { db } from '@/integrations/firebase/client';
import { collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { ServiceBooking } from '@/components/booking/ServiceBooking';
import { useTranslation } from '@/lib/i18n';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface MyBookingsProps {
  customerId: string;
  language?: 'ar' | 'en';
  cancellationPolicyHours?: number;
}

export function MyBookings({
  customerId,
  language = 'ar',
  cancellationPolicyHours = 24,
}: MyBookingsProps) {
  const { toast } = useToast();
  const { t, isRTL: isRTLFromHook } = useTranslation(language);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  
  // Review state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [existingReviews, setExistingReviews] = useState<Set<string>>(new Set());
  
  // Edit booking state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBookingForEdit, setSelectedBookingForEdit] = useState<Booking | null>(null);
  const [serviceDetails, setServiceDetails] = useState<any>(null);
  
  // Provider contact info + location
  const [providerContacts, setProviderContacts] = useState<Record<string, {phone?: string[], whatsapp?: string, latitude?: number, longitude?: number}>>({});
  const [customerLocation, setCustomerLocation] = useState<{latitude: number, longitude: number} | null>(null);
  
  // Cache for service cancellation hours
  const [serviceCancellationHours, setServiceCancellationHours] = useState<Record<string, number>>({});

  const isRTL = isRTLFromHook;
  const dateLocale = language === 'ar' ? ar : enUS;

  // Local translations for parts not yet in i18n
  const localT = {
    loading: isRTL ? 'جاري التحميل...' : 'Loading...',
    service: isRTL ? 'الخدمة' : 'Service',
    date: isRTL ? 'التاريخ' : 'Date',
    time: isRTL ? 'الوقت' : 'Time',
    price: isRTL ? 'السعر' : 'Price',
    status: isRTL ? 'الحالة' : 'Status',
    notes: isRTL ? 'ملاحظات' : 'Notes',
    cancel: isRTL ? 'إلغاء الحجز' : 'Cancel Booking',
    cancelling: isRTL ? 'جاري الإلغاء...' : 'Cancelling...',
    cancelTitle: isRTL ? 'إلغاء الحجز' : 'Cancel Booking',
    cancelDesc: isRTL ? 'هل أنت متأكد من إلغاء هذا الحجز؟' : 'Are you sure you want to cancel this booking?',
    cancelWarning: isRTL ? 'لا يمكن التراجع عن هذا الإجراء' : 'This action cannot be undone',
    confirmCancel: isRTL ? 'نعم، إلغاء' : 'Yes, Cancel',
    keepBooking: isRTL ? 'الإبقاء على الحجز' : 'Keep Booking',
    cancelled: isRTL ? 'تم إلغاء الحجز' : 'Booking Cancelled',
    cancelSuccess: isRTL ? 'تم إلغاء حجزك بنجاح' : 'Your booking has been cancelled',
    cancelFailed: isRTL ? 'فشل إلغاء الحجز' : 'Failed to cancel booking',
    cannotCancel: isRTL ? 'لا يمكن الإلغاء' : 'Cannot Cancel',
    cannotCancelDesc: isRTL
      ? `يجب إلغاء الحجز قبل ${cancellationPolicyHours} ساعة على الأقل`
      : `Booking must be cancelled at least ${cancellationPolicyHours} hours before`,
    contactProvider: isRTL ? 'اتصل بمقدم الخدمة' : 'Contact Provider',
    edit: isRTL ? 'تعديل الحجز' : 'Edit Booking',
    editTitle: isRTL ? 'تعديل الحجز' : 'Edit Booking',
    editDesc: isRTL ? 'اختر موعداً جديداً للحجز' : 'Choose a new appointment time',
    editSuccess: isRTL ? 'تم تحديث الحجز' : 'Booking Updated',
    editSuccessDesc: isRTL ? 'تم تحديث تفاصيل حجزك بنجاح' : 'Your booking has been updated successfully',
    editError: isRTL ? 'فشل تحديث الحجز' : 'Failed to update booking',
    rateService: isRTL ? 'قيّم الخدمة' : 'Rate Service',
    yourRating: isRTL ? 'تقييمك' : 'Your Rating',
    writeReview: isRTL ? 'اكتب تقييمك (اختياري)' : 'Write your review (optional)',
    reviewPlaceholder: isRTL ? 'شارك تجربتك مع الخدمة...' : 'Share your experience with the service...',
    submitReview: isRTL ? 'إرسال التقييم' : 'Submit Review',
    submitting: isRTL ? 'جاري الإرسال...' : 'Submitting...',
    reviewSuccess: isRTL ? 'تم إرسال تقييمك' : 'Review Submitted',
    reviewSuccessDesc: isRTL ? 'شكراً لك على تقييم الخدمة' : 'Thank you for rating the service',
    reviewError: isRTL ? 'فشل إرسال التقييم' : 'Failed to submit review',
    noPast: isRTL ? 'ليس لديك حجوزات سابقة' : "You don't have any past bookings",
    statuses: {
      pending: isRTL ? 'قيد الانتظار' : 'Pending',
      cancelled: isRTL ? 'ملغي' : 'Cancelled',
      'no-show': isRTL ? 'لم يحضر' : 'No Show',
    },
  };

  useEffect(() => {
    setIsLoading(true);
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToCustomerBookings(customerId, async (data) => {
      setBookings(data);
      
      // Load cancellation hours for each unique service
      const uniqueServiceIds = [...new Set(data.map(b => b.service_id))];
      const hoursCache: Record<string, number> = {};
      
      await Promise.all(
        uniqueServiceIds.map(async (serviceId) => {
          try {
            const serviceDoc = await getDoc(doc(db, 'services', serviceId));
            if (serviceDoc.exists()) {
              hoursCache[serviceId] = serviceDoc.data().cancellation_policy_hours || 24;
            }
          } catch (error) {
            console.error(`Error loading service ${serviceId}:`, error);
          }
        })
      );
      
      setServiceCancellationHours(hoursCache);
      setIsLoading(false);
      
      // Load provider contacts for all bookings
      loadProviderContacts(data);
    });
    
    // Load existing reviews
    loadExistingReviews();
    
    // Load customer location
    loadCustomerLocation();
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [customerId]);

  // Refresh cancellation hours every 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (bookings.length === 0) return;
      
      const uniqueServiceIds = [...new Set(bookings.map(b => b.service_id))];
      const hoursCache: Record<string, number> = {};
      
      await Promise.all(
        uniqueServiceIds.map(async (serviceId) => {
          try {
            const serviceDoc = await getDoc(doc(db, 'services', serviceId));
            if (serviceDoc.exists()) {
              hoursCache[serviceId] = serviceDoc.data().cancellation_policy_hours || 24;
            }
          } catch (error) {
            console.error(`Error loading service ${serviceId}:`, error);
          }
        })
      );
      
      setServiceCancellationHours(hoursCache);
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(interval);
  }, [bookings]);

  const loadCustomerLocation = async () => {
    try {
      const customerDoc = await getDoc(doc(db, 'profiles', customerId));
      if (customerDoc.exists()) {
        const data = customerDoc.data();
        console.log('📍 Customer location data:', {
          customerId,
          hasLatitude: !!data.latitude,
          hasLongitude: !!data.longitude,
          latitude: data.latitude,
          longitude: data.longitude
        });
        if (data.latitude && data.longitude) {
          setCustomerLocation({
            latitude: data.latitude,
            longitude: data.longitude
          });
          console.log('✅ Customer location set:', { latitude: data.latitude, longitude: data.longitude });
        } else {
          console.warn('⚠️ Customer location not available in profile');
        }
      }
    } catch (error) {
      console.error('Error loading customer location:', error);
    }
  };

  const loadProviderContacts = async (bookingsData: Booking[]) => {
    const providerIds = [...new Set(bookingsData.map(b => b.provider_id))];
    const contacts: Record<string, {phone?: string[], whatsapp?: string, latitude?: number, longitude?: number}> = {};
    
    console.log('📍 Loading provider locations for', providerIds.length, 'providers');
    
    for (const providerId of providerIds) {
      try {
        const providerDoc = await getDoc(doc(db, 'profiles', providerId));
        if (providerDoc.exists()) {
          const data = providerDoc.data();
          console.log(`📍 Provider ${providerId}:`, {
            hasLatitude: !!data.latitude,
            hasLongitude: !!data.longitude,
            latitude: data.latitude,
            longitude: data.longitude
          });
          contacts[providerId] = {
            phone: data.phone_numbers,
            whatsapp: data.whatsapp_number,
            latitude: data.latitude,
            longitude: data.longitude
          };
        }
      } catch (error) {
        console.error(`Error loading provider ${providerId}:`, error);
      }
    }
    
    console.log('✅ Provider contacts loaded:', contacts);
    setProviderContacts(contacts);
  };

  const loadExistingReviews = async () => {
    try {
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('customer_id', '==', customerId)
      );
      const reviewsSnapshot = await getDocs(reviewsQuery);
      const reviewedBookingIds = new Set(
        reviewsSnapshot.docs.map(doc => doc.data().booking_id).filter(Boolean)
      );
      setExistingReviews(reviewedBookingIds);
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  const loadBookings = async () => {
    // Kept for manual refresh if needed
    setIsLoading(true);
    try {
      const data = await getCustomerBookings(customerId);
      setBookings(data);
      
      // Load cancellation hours for each unique service
      const uniqueServiceIds = [...new Set(data.map(b => b.service_id))];
      const hoursCache: Record<string, number> = {};
      
      await Promise.all(
        uniqueServiceIds.map(async (serviceId) => {
          try {
            const serviceDoc = await getDoc(doc(db, 'services', serviceId));
            if (serviceDoc.exists()) {
              hoursCache[serviceId] = serviceDoc.data().cancellation_policy_hours || 24;
            }
          } catch (error) {
            console.error(`Error loading service ${serviceId}:`, error);
          }
        })
      );
      
      setServiceCancellationHours(hoursCache);
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'فشل تحميل الحجوزات' : 'Failed to load bookings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenReviewDialog = (booking: Booking) => {
    setSelectedBookingForReview(booking);
    setReviewRating(5);
    setReviewComment('');
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedBookingForReview) return;

    setIsSubmittingReview(true);
    try {
      const reviewData = {
        customer_id: customerId,
        provider_id: selectedBookingForReview.provider_id,
        service_id: selectedBookingForReview.service_id,
        booking_id: selectedBookingForReview.booking_id,
        rating: reviewRating,
        comment: reviewComment.trim(),
        is_approved: true,
        is_comment_enabled: true,
        created_at: new Date(),
      };

      await addDoc(collection(db, 'reviews'), reviewData);

      // Update existing reviews set
      setExistingReviews(prev => {
        const newSet = new Set(prev);
        newSet.add(selectedBookingForReview.booking_id);
        return newSet;
      });

      toast({
        title: localT.reviewSuccess,
        description: localT.reviewSuccessDesc,
      });

      setReviewDialogOpen(false);
      setSelectedBookingForReview(null);
      setReviewRating(5);
      setReviewComment('');

      // Reload reviews to update CustomerDashboard
      await loadExistingReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: localT.reviewError,
        description: isRTL ? 'حدث خطأ أثناء إرسال التقييم' : 'An error occurred while submitting the review',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Handle open edit dialog - Load service details
  const handleOpenEditDialog = async (booking: Booking) => {
    setSelectedBookingForEdit(booking);
    
    // Load service details including booking settings
    try {
      const serviceDoc = await getDoc(doc(db, 'services', booking.service_id));
      if (serviceDoc.exists()) {
        const serviceData = serviceDoc.data();
        
        // Load provider timezone
        let providerTimezone = 'Asia/Dubai';
        try {
          const providerDoc = await getDoc(doc(db, 'profiles', booking.provider_id));
          if (providerDoc.exists()) {
            providerTimezone = providerDoc.data().timezone || 'Asia/Dubai';
          }
        } catch (error) {
          console.error('Error loading provider timezone:', error);
        }
        
        // Build booking settings from service data
        const bookingSettings: BookingSettings = {
          booking_enabled: true,
          duration_minutes: serviceData.duration_minutes || 60,
          advance_booking_days: serviceData.advance_booking_days || 30,
          cancellation_policy_hours: serviceData.cancellation_policy_hours || 24,
          max_concurrent_bookings: serviceData.max_concurrent_bookings || 1,
          require_confirmation: serviceData.require_confirmation || false,
          allow_customer_cancellation: serviceData.allow_customer_cancellation || true,
          buffer_time_minutes: serviceData.buffer_time_minutes || 0,
        };
        
        setServiceDetails({
          ...serviceData,
          id: booking.service_id,
          bookingSettings,
          providerTimezone,
        });
        
        setEditDialogOpen(true);
      }
    } catch (error) {
      console.error('Error loading service details:', error);
      toast({
        title: localT.editError,
        description: isRTL ? 'فشل تحميل تفاصيل الخدمة' : 'Failed to load service details',
        variant: 'destructive',
      });
    }
  };

  // Handle booking complete (from ServiceBooking component)
  const handleEditBookingComplete = async (newBookingId: string) => {
    // Delete the old booking
    if (selectedBookingForEdit) {
      try {
        await deleteDoc(doc(db, 'bookings', selectedBookingForEdit.booking_id));
        
        toast({
          title: localT.editSuccess,
          description: localT.editSuccessDesc,
        });
        
        setEditDialogOpen(false);
        setSelectedBookingForEdit(null);
        setServiceDetails(null);
      } catch (error) {
        console.error('Error deleting old booking:', error);
      }
    }
  };

  const handleCancelBooking = async (booking: Booking) => {
    const bookingCancellationHours = booking.cancellation_policy_hours || serviceCancellationHours[booking.service_id] || cancellationPolicyHours;
    
    if (!canCancelBooking(booking, bookingCancellationHours)) {
      toast({
        title: localT.cannotCancel,
        description: isRTL
          ? `يجب إلغاء الحجز قبل ${bookingCancellationHours} ${bookingCancellationHours === 1 ? 'ساعة' : 'ساعات'} على الأقل من الموعد`
          : `Booking must be cancelled at least ${bookingCancellationHours} ${bookingCancellationHours === 1 ? 'hour' : 'hours'} before`,
        variant: 'destructive',
      });
      return;
    }

    setCancellingId(booking.booking_id);
    try {
      await cancelBooking(booking.booking_id, isRTL ? 'تم الإلغاء من قبل العميل' : 'Cancelled by customer');
      
      toast({
        title: localT.cancelled,
        description: localT.cancelSuccess,
      });

      // Reload bookings
      await loadBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: localT.cancelFailed,
        description: isRTL ? 'حدث خطأ أثناء الإلغاء' : 'An error occurred while cancelling',
        variant: 'destructive',
      });
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    const variants: Record<BookingStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      confirmed: 'default',
      cancelled: 'destructive',
      completed: 'outline',
      'no-show': 'destructive',
    };

    // Use i18n translations for confirmed and completed, localT for others
    let statusText = '';
    if (status === 'confirmed') {
      statusText = t.customer.statusConfirmed || 'Confirmed';
    } else if (status === 'completed') {
      statusText = t.customer.statusCompleted || 'Completed';
    } else {
      statusText = localT.statuses[status];
    }

    return (
      <Badge variant={variants[status]}>
        {statusText}
      </Badge>
    );
  };

  const isUpcoming = (booking: Booking) => {
    // Upcoming = confirmed OR pending, AND date in future
    const isActiveStatus = booking.status === 'confirmed' || booking.status === 'pending';
    
    // Parse booking date + time carefully
    const [year, month, day] = booking.booking_date.split('-').map(Number);
    const [hour, minute] = booking.start_time.split(':').map(Number);
    
    const bookingDate = new Date(year, month - 1, day, hour, minute);
    const now = new Date();
    
    // Debug log
    console.log('Booking check:', {
      booking_id: booking.booking_id,
      date: booking.booking_date,
      time: booking.start_time,
      bookingDate: bookingDate.toISOString(),
      now: now.toISOString(),
      isFuture: bookingDate > now,
      status: booking.status,
      isActiveStatus
    });
    
    const isFutureDate = bookingDate > now;
    
    return isFutureDate && isActiveStatus;
  };

  const upcomingBookings = bookings.filter(isUpcoming);
  const pastBookings = bookings.filter(b => !isUpcoming(b));

  const renderBookingCard = (booking: Booking) => {
    // استخدام cancellation_policy_hours من الحجز، أو من الخدمة، أو القيمة الافتراضية
    const bookingCancellationHours = booking.cancellation_policy_hours || serviceCancellationHours[booking.service_id] || cancellationPolicyHours;
    const canCancel = canCancelBooking(booking, bookingCancellationHours);
    const bookingDate = new Date(booking.booking_date);

    return (
      <Card key={booking.booking_id} data-booking-id={booking.booking_id} id={`booking-${booking.booking_id}`} className="bg-muted/50 hover:bg-muted/70 transition-colors">
        <CardContent className="p-4 space-y-4">
          {/* Service Title */}
          <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{booking.service_title}</h3>
            {booking.notes && (
              <p className="text-sm text-muted-foreground mt-2">{booking.notes}</p>
            )}
          </div>
          {getStatusBadge(booking.status)}
        </div>

        <Separator />

        {/* Booking Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(bookingDate, 'PPP', { locale: dateLocale })}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {formatTimeDisplay(booking.start_time, language)} - {formatTimeDisplay(booking.end_time, language)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">
              {booking.price} {booking.currency}
            </span>
          </div>

          {/* Distance to provider */}
          {customerLocation && providerContacts[booking.provider_id]?.latitude && providerContacts[booking.provider_id]?.longitude && (
            <div className="flex items-center gap-2 text-sm text-primary font-medium">
              <Navigation className="h-4 w-4" />
              <span>
                {formatDistance(
                  calculateDistance(
                    customerLocation,
                    {
                      latitude: providerContacts[booking.provider_id].latitude!,
                      longitude: providerContacts[booking.provider_id].longitude!
                    }
                  ),
                  language
                )}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        {isUpcoming(booking) && booking.status !== 'cancelled' && (
          <>
            <Separator />
            <div className="flex gap-2 flex-wrap">
              {/* Edit Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenEditDialog(booking)}
                className="flex-1 min-w-[120px]"
              >
                <Edit className="h-4 w-4 mr-1" />
                {localT.edit}
              </Button>

              {/* Phone Button */}
              {providerContacts[booking.provider_id]?.phone && providerContacts[booking.provider_id]?.phone.length > 0 && (
                <Button variant="outline" size="sm" className="flex-1 min-w-[120px]" asChild>
                  <a href={`tel:${providerContacts[booking.provider_id].phone[0]}`}>
                    <Phone className="h-4 w-4 mr-1" />
                    {localT.contactProvider}
                  </a>
                </Button>
              )}

              {/* WhatsApp Button */}
              {providerContacts[booking.provider_id]?.whatsapp && (
                <Button variant="outline" size="sm" className="flex-1 min-w-[120px]" asChild>
                  <a href={`https://wa.me/${providerContacts[booking.provider_id].whatsapp.replace(/[^\d]/g, '')}`} target="_blank" rel="noopener noreferrer">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    {isRTL ? 'واتساب' : 'WhatsApp'}
                  </a>
                </Button>
              )}

              {/* Cancel Button - Last */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={!canCancel || cancellingId === booking.booking_id}
                    className="flex-1 min-w-[120px]"
                  >
                    {cancellingId === booking.booking_id ? (
                      localT.cancelling
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-1" />
                        {localT.cancel}
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{localT.cancelTitle}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {localT.cancelDesc}
                      <br />
                      <span className="text-destructive">{localT.cancelWarning}</span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{localT.keepBooking}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleCancelBooking(booking)}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {localT.confirmCancel}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Cancellation Policy Info - Always show */}
            <div className={`flex items-start gap-2 text-xs p-3 rounded-md ${canCancel ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-red-500/10 text-red-700 dark:text-red-400'}`}>
              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>
                {canCancel ? (
                  isRTL
                    ? `يمكنك إلغاء الحجز حتى ${bookingCancellationHours} ${bookingCancellationHours === 1 ? 'ساعة' : 'ساعات'} قبل الموعد`
                    : `You can cancel until ${bookingCancellationHours} ${bookingCancellationHours === 1 ? 'hour' : 'hours'} before`
                ) : (
                  isRTL
                    ? `لا يمكن إلغاء الحجز - يجب إلغاء قبل ${bookingCancellationHours} ${bookingCancellationHours === 1 ? 'ساعة' : 'ساعات'} من الموعد`
                    : `Cannot cancel - Booking must be cancelled at least ${bookingCancellationHours} ${bookingCancellationHours === 1 ? 'hour' : 'hours'} before`
                )}
              </span>
            </div>
          </>
        )}

        {/* Review Action for Completed Bookings */}
        {!isUpcoming(booking) && booking.status === 'completed' && (
          <>
            <Separator />
            <div className="flex gap-2">
              {existingReviews.has(booking.booking_id) ? (
                <Button variant="outline" size="sm" disabled className="flex-1">
                  <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                  {t.customer.alreadyReviewed || 'Already Reviewed'}
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleOpenReviewDialog(booking)}
                >
                  <Star className="h-4 w-4 mr-1" />
                  {t.customer.reviewService || 'Review Service'}
                </Button>
              )}
            </div>
          </>
        )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="py-8" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-center">
          <p className="text-muted-foreground">{localT.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upcoming' | 'past')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">
            {t.customer.upcoming} ({upcomingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            {t.customer.past} ({pastBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4 mt-6">
          {upcomingBookings.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">{t.customer.noUpcomingBookings}</p>
            </div>
          ) : (
            upcomingBookings.map(renderBookingCard)
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4 mt-6">
          {pastBookings.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">{localT.noPast}</p>
            </div>
          ) : (
            pastBookings.map(renderBookingCard)
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{localT.rateService}</DialogTitle>
            <DialogDescription>
              {selectedBookingForReview?.service_title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Star Rating */}
            <div className="space-y-2">
              <Label>{localT.yourRating}</Label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary rounded"
                  >
                    <Star
                      className={`h-10 w-10 ${
                        star <= reviewRating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {reviewRating} {isRTL ? 'من 5 نجوم' : 'out of 5 stars'}
              </p>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <Label htmlFor="review-comment">{localT.writeReview}</Label>
              <Textarea
                id="review-comment"
                placeholder={localT.reviewPlaceholder}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
              disabled={isSubmittingReview}
            >
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={isSubmittingReview}
            >
              {isSubmittingReview ? localT.submitting : localT.submitReview}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Booking Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{localT.editTitle}</DialogTitle>
            <DialogDescription>{localT.editDesc}</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {selectedBookingForEdit && serviceDetails && (
              <ServiceBooking
                serviceId={selectedBookingForEdit.service_id}
                providerId={selectedBookingForEdit.provider_id}
                customerId={customerId}
                customerName={selectedBookingForEdit.customer_name}
                customerPhone={selectedBookingForEdit.customer_phone}
                serviceTitle={selectedBookingForEdit.service_title}
                price={selectedBookingForEdit.price}
                currency={selectedBookingForEdit.currency}
                bookingSettings={serviceDetails.bookingSettings}
                providerTimezone={serviceDetails.providerTimezone || 'Asia/Dubai'}
                language={language}
                onBookingComplete={handleEditBookingComplete}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
