// My Bookings Component - Customer's bookings list
// مكون حجوزاتي - قائمة حجوزات العميل

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Booking, BookingStatus } from '@/types/booking';
import { getCustomerBookings, cancelBooking } from '@/lib/firebase/bookingFunctions';
import { formatTimeDisplay, canCancelBooking } from '@/lib/bookingUtils';
import { Calendar, Clock, MapPin, Phone, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const isRTL = language === 'ar';
  const dateLocale = language === 'ar' ? ar : enUS;

  // Translation
  const t = {
    title: isRTL ? 'حجوزاتي' : 'My Bookings',
    subtitle: isRTL ? 'عرض وإدارة حجوزاتك' : 'View and manage your bookings',
    upcoming: isRTL ? 'القادمة' : 'Upcoming',
    past: isRTL ? 'السابقة' : 'Past',
    noBookings: isRTL ? 'لا توجد حجوزات' : 'No bookings',
    noUpcoming: isRTL ? 'ليس لديك حجوزات قادمة' : "You don't have any upcoming bookings",
    noPast: isRTL ? 'ليس لديك حجوزات سابقة' : "You don't have any past bookings",
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
    statuses: {
      pending: isRTL ? 'قيد الانتظار' : 'Pending',
      confirmed: isRTL ? 'مؤكد' : 'Confirmed',
      cancelled: isRTL ? 'ملغي' : 'Cancelled',
      completed: isRTL ? 'مكتمل' : 'Completed',
      'no-show': isRTL ? 'لم يحضر' : 'No Show',
    },
  };

  useEffect(() => {
    loadBookings();
    
    // Auto-refresh every 30 seconds to reflect updates
    const interval = setInterval(() => {
      loadBookings();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [customerId]);

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      const data = await getCustomerBookings(customerId);
      setBookings(data);
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

  const handleCancelBooking = async (booking: Booking) => {
    if (!canCancelBooking(booking, cancellationPolicyHours)) {
      toast({
        title: t.cannotCancel,
        description: t.cannotCancelDesc,
        variant: 'destructive',
      });
      return;
    }

    setCancellingId(booking.booking_id);
    try {
      await cancelBooking(booking.booking_id, isRTL ? 'تم الإلغاء من قبل العميل' : 'Cancelled by customer');
      
      toast({
        title: t.cancelled,
        description: t.cancelSuccess,
      });

      // Reload bookings
      await loadBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: t.cancelFailed,
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

    return (
      <Badge variant={variants[status]}>
        {t.statuses[status]}
      </Badge>
    );
  };

  const isUpcoming = (booking: Booking) => {
    // Upcoming = confirmed OR pending, AND date in future
    const bookingDate = new Date(`${booking.booking_date}T${booking.start_time}`);
    const now = new Date();
    const isFutureDate = bookingDate >= now;
    const isActiveStatus = booking.status === 'confirmed' || booking.status === 'pending';
    
    return isFutureDate && isActiveStatus;
  };

  const upcomingBookings = bookings.filter(isUpcoming);
  const pastBookings = bookings.filter(b => !isUpcoming(b));

  const renderBookingCard = (booking: Booking) => {
    const canCancel = canCancelBooking(booking, cancellationPolicyHours);
    const bookingDate = new Date(booking.booking_date);

    return (
      <Card key={booking.booking_id}>
        <CardContent className="pt-6">
          <div className="space-y-4">
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
            </div>

            {/* Actions */}
            {isUpcoming(booking) && booking.status !== 'cancelled' && (
              <>
                <Separator />
                <div className="flex gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!canCancel || cancellingId === booking.booking_id}
                        className="flex-1"
                      >
                        {cancellingId === booking.booking_id ? (
                          t.cancelling
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-1" />
                            {t.cancel}
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t.cancelTitle}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t.cancelDesc}
                          <br />
                          <span className="text-destructive">{t.cancelWarning}</span>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t.keepBooking}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleCancelBooking(booking)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          {t.confirmCancel}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  {booking.customer_phone && (
                    <Button variant="default" size="sm" className="flex-1" asChild>
                      <a href={`tel:${booking.customer_phone}`}>
                        <Phone className="h-4 w-4 mr-1" />
                        {t.contactProvider}
                      </a>
                    </Button>
                  )}
                </div>

                {!canCancel && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <AlertCircle className="h-3 w-3" />
                    <span>{t.cannotCancelDesc}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Card dir={isRTL ? 'rtl' : 'ltr'}>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <p className="text-muted-foreground">{t.loading}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upcoming' | 'past')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming">
              {t.upcoming} ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              {t.past} ({pastBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4 mt-6">
            {upcomingBookings.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">{t.noUpcoming}</p>
              </div>
            ) : (
              upcomingBookings.map(renderBookingCard)
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4 mt-6">
            {pastBookings.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">{t.noPast}</p>
              </div>
            ) : (
              pastBookings.map(renderBookingCard)
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
