// Service Booking Component for Customers
// مكون حجز الخدمة للعملاء

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Clock, User, DollarSign, CheckCircle, ArrowLeft } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import {
  TimeSlot,
  DailyAvailability,
  BookingSettings,
} from '@/types/booking';
import {
  getDailyAvailability,
  formatDate,
  formatTimeDisplay,
  calculateEndTime,
  getDayOfWeek,
  isDateBookable,
} from '@/lib/bookingUtils';
import {
  getServiceSchedule,
  getServiceBookings,
  createBooking,
} from '@/lib/firebase/bookingFunctions';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface ServiceBookingProps {
  serviceId: string;
  providerId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  serviceTitle: string;
  price: number;
  currency: string;
  bookingSettings: BookingSettings;
  providerTimezone?: string;
  language?: 'ar' | 'en';
  onBookingComplete?: (bookingId: string) => void;
  onBack?: () => void;
}

export function ServiceBooking({
  serviceId,
  providerId,
  customerId,
  customerName,
  customerPhone,
  serviceTitle,
  price,
  currency,
  bookingSettings,
  providerTimezone = 'Asia/Dubai',
  language = 'ar',
  onBookingComplete,
  onBack,
}: ServiceBookingProps) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [availability, setAvailability] = useState<DailyAvailability | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: date, 2: time, 3: confirm

  const isRTL = language === 'ar';
  const dateLocale = language === 'ar' ? ar : enUS;

  // Translation
  const t = {
    title: isRTL ? 'حجز موعد' : 'Book Appointment',
    subtitle: isRTL ? 'اختر التاريخ والوقت المناسب لك' : 'Choose a suitable date and time',
    selectDate: isRTL ? 'اختر التاريخ' : 'Select Date',
    selectTime: isRTL ? 'اختر الوقت' : 'Select Time',
    confirmBooking: isRTL ? 'تأكيد الحجز' : 'Confirm Booking',
    availableSlots: isRTL ? 'الأوقات المتاحة' : 'Available Times',
    noAvailableSlots: isRTL ? 'لا توجد أوقات متاحة في هذا اليوم' : 'No available times on this day',
    serviceClosed: isRTL ? 'الخدمة مغلقة في هذا اليوم' : 'Service closed on this day',
    bookingDetails: isRTL ? 'تفاصيل الحجز' : 'Booking Details',
    service: isRTL ? 'الخدمة' : 'Service',
    date: isRTL ? 'التاريخ' : 'Date',
    time: isRTL ? 'الوقت' : 'Time',
    duration: isRTL ? 'المدة' : 'Duration',
    price: isRTL ? 'السعر' : 'Price',
    notes: isRTL ? 'ملاحظات (اختياري)' : 'Notes (optional)',
    notesPlaceholder: isRTL ? 'أضف أي ملاحظات خاصة...' : 'Add any special notes...',
    back: isRTL ? 'رجوع' : 'Back',
    next: isRTL ? 'التالي' : 'Next',
    book: isRTL ? 'تأكيد الحجز' : 'Confirm Booking',
    booking: isRTL ? 'جاري الحجز...' : 'Booking...',
    success: isRTL ? 'تم الحجز بنجاح' : 'Booking Successful',
    successDesc: isRTL ? 'تم إنشاء حجزك بنجاح' : 'Your booking has been created',
    failed: isRTL ? 'فشل الحجز' : 'Booking Failed',
    minutes: isRTL ? 'دقيقة' : 'minutes',
    available: isRTL ? 'متاح' : 'Available',
    partiallyBooked: isRTL ? 'محجوز جزئياً' : 'Partially Booked',
    fullyBooked: isRTL ? 'غير متاح' : 'Unavailable',
    slots: isRTL ? 'مقاعد' : 'slots',
    requiresConfirmation: isRTL ? 'يتطلب تأكيد من مقدم الخدمة' : 'Requires provider confirmation',
  };

  // Load availability when date changes
  useEffect(() => {
    if (selectedDate) {
      loadAvailability(selectedDate);
    }
  }, [selectedDate]);

  const loadAvailability = async (date: Date) => {
    setIsLoadingSlots(true);
    setSelectedTime(undefined);
    
    try {
      const dateString = formatDate(date);
      const dayOfWeek = getDayOfWeek(dateString);

      console.log('🔍 Loading availability:', { 
        dateString, 
        dayOfWeek, 
        serviceId 
      });

      // Get schedule for this day
      const schedule = await getServiceSchedule(serviceId, dayOfWeek);
      
      console.log('📅 Schedule loaded:', schedule);
      
      if (!schedule) {
        console.warn('⚠️ No schedule found for this day');
        toast({
          title: isRTL ? 'تنبيه' : 'Notice',
          description: isRTL 
            ? 'لم يتم تحديد جدول عمل لهذا اليوم. يرجى مراجعة مزود الخدمة.' 
            : 'No schedule set for this day. Please contact the service provider.',
          variant: 'destructive',
        });
        setAvailability({
          date: dateString,
          day_of_week: dayOfWeek,
          is_available: false,
          slots: []
        });
        setIsLoadingSlots(false);
        return;
      }
      
      // Get existing bookings
      const bookings = await getServiceBookings(serviceId, dateString);
      
      console.log('📋 Bookings loaded:', bookings.length);

      // Calculate availability
      const dailyAvailability = getDailyAvailability(
        dateString,
        schedule,
        bookings,
        bookingSettings,
        providerTimezone
      );

      console.log('✅ Availability calculated:', dailyAvailability);

      setAvailability(dailyAvailability);
    } catch (error) {
      console.error('❌ Error loading availability:', error);
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'فشل تحميل الأوقات المتاحة' : 'Failed to load available times',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    // Check if date is bookable
    const dateString = formatDate(date);
    if (!isDateBookable(dateString, bookingSettings.advance_booking_days)) {
      toast({
        title: isRTL ? 'تاريخ غير صالح' : 'Invalid Date',
        description: isRTL
          ? `يمكن الحجز حتى ${bookingSettings.advance_booking_days} يوم مقدماً فقط`
          : `Booking allowed up to ${bookingSettings.advance_booking_days} days in advance`,
        variant: 'destructive',
      });
      return;
    }

    setSelectedDate(date);
    setStep(2);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep(3);
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) return;

    setIsBooking(true);
    try {
      const dateString = formatDate(selectedDate);
      const endTime = calculateEndTime(selectedTime, bookingSettings.duration_minutes);

      const bookingData = {
        service_id: serviceId,
        provider_id: providerId,
        customer_id: customerId,
        customer_name: customerName,
        customer_phone: customerPhone,
        service_title: serviceTitle,
        booking_date: dateString,
        start_time: selectedTime,
        end_time: endTime,
        status: bookingSettings.require_confirmation ? ('pending' as const) : ('confirmed' as const),
        price,
        currency,
        notes,
      };

      const bookingId = await createBooking(bookingData);

      toast({
        title: t.success,
        description: bookingSettings.require_confirmation
          ? (isRTL ? 'سيتم تأكيد حجزك قريباً' : 'Your booking will be confirmed soon')
          : t.successDesc,
      });

      if (onBookingComplete) {
        onBookingComplete(bookingId);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: t.failed,
        description: isRTL ? 'حدث خطأ أثناء إنشاء الحجز' : 'An error occurred while creating booking',
        variant: 'destructive',
      });
    } finally {
      setIsBooking(false);
    }
  };

  const getSlotBadge = (slot: TimeSlot) => {
    if (!slot.available) {
      return <Badge variant="destructive">{t.fullyBooked}</Badge>;
    }
    if (slot.booked > 0) {
      return (
        <Badge variant="secondary">
          {slot.booked}/{slot.capacity} {t.slots}
        </Badge>
      );
    }
    return <Badge variant="outline">{t.available}</Badge>;
  };

  return (
    <div className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
      <Card className="w-full border-0 bg-transparent shadow-none">
        <CardContent className="px-4 sm:px-6 py-4 sm:py-6 space-y-6">
          {/* Step 1: Select Date */}
          {step === 1 && (
            <div className="space-y-4 w-full">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm sm:text-base">{t.selectDate}</Label>
                {onBack && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    className="flex items-center gap-2 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                  >
                    <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="hidden sm:inline">{isRTL ? 'رجوع' : 'Back'}</span>
                  </Button>
                )}
              </div>
              <div className="w-full flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const dateString = formatDate(date);
                    return (
                      date < today ||
                      !isDateBookable(dateString, bookingSettings.advance_booking_days)
                    );
                  }}
                  locale={dateLocale}
                  className="rounded-md border max-w-full"
                />
              </div>
            </div>
          )}

          {/* Step 2: Select Time */}
          {step === 2 && selectedDate && (
            <div className="space-y-4 w-full">
              <div className="flex items-center justify-between gap-2">
                <Label className="flex items-center gap-2 text-sm sm:text-base">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span>{t.availableSlots}</span>
                </Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setStep(1)}
                  className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                >
                  {t.back}
                </Button>
              </div>

              <div className="p-3 sm:p-4 bg-muted rounded-lg w-full">
                <p className="text-xs sm:text-sm font-medium">
                  {format(selectedDate, 'PPPP', { locale: dateLocale })}
                </p>
              </div>

              {isLoadingSlots ? (
                <div className="py-8 text-center w-full">
                  <p className="text-xs sm:text-sm text-muted-foreground">{isRTL ? 'جاري التحميل...' : 'Loading...'}</p>
                </div>
              ) : !availability || !availability.is_available ? (
                <div className="py-8 text-center w-full">
                  <p className="text-xs sm:text-sm text-muted-foreground">{t.serviceClosed}</p>
                </div>
              ) : availability.slots.length === 0 ? (
                <div className="py-8 text-center w-full">
                  <p className="text-xs sm:text-sm text-muted-foreground">{t.noAvailableSlots}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 w-full">
                  {availability.slots.map((slot) => (
                    <Button
                      key={slot.time}
                      variant={slot.available ? 'outline' : 'ghost'}
                      disabled={!slot.available}
                      onClick={() => handleTimeSelect(slot.time)}
                      className="flex flex-col h-auto py-2 sm:py-3 px-2 text-xs sm:text-sm"
                    >
                      <span className="font-medium text-xs sm:text-sm">
                        {formatTimeDisplay(slot.time, language)}
                      </span>
                      <span className="text-[10px] sm:text-xs mt-1">
                        {getSlotBadge(slot)}
                      </span>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && selectedDate && selectedTime && (
            <div className="space-y-4 w-full">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm sm:text-base">{t.confirmBooking}</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setStep(2)}
                  className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                >
                  {t.back}
                </Button>
              </div>

              <Card className="w-full">
                <CardHeader className="px-3 sm:px-4 py-3 sm:py-4">
                  <CardTitle className="text-base sm:text-lg">{t.bookingDetails}</CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-4 py-3 sm:py-4 space-y-3">
                  <div className="flex justify-between text-xs sm:text-sm gap-2">
                    <span className="text-muted-foreground">{t.service}:</span>
                    <span className="font-medium text-right break-words">{serviceTitle}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-xs sm:text-sm gap-2">
                    <span className="text-muted-foreground">{t.date}:</span>
                    <span className="font-medium">
                      {format(selectedDate, 'PP', { locale: dateLocale })}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm gap-2">
                    <span className="text-muted-foreground">{t.time}:</span>
                    <span className="font-medium">
                      {formatTimeDisplay(selectedTime, language)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm gap-2">
                    <span className="text-muted-foreground">{t.duration}:</span>
                    <span className="font-medium">
                      {bookingSettings.duration_minutes} {t.minutes}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm sm:text-base gap-2">
                    <span className="text-muted-foreground">{t.price}:</span>
                    <span className="font-semibold">
                      {price} {currency}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <div className="space-y-2 w-full">
                <Label htmlFor="notes" className="text-xs sm:text-sm">{t.notes}</Label>
                <Textarea
                  id="notes"
                  placeholder={t.notesPlaceholder}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="text-xs sm:text-sm resize-none"
                />
              </div>

              {bookingSettings.require_confirmation && (
                <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-950 rounded-lg w-full">
                  <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-100">
                    ℹ️ {t.requiresConfirmation}
                  </p>
                </div>
              )}

              {/* Book Button */}
              <Button
                onClick={handleBooking}
                disabled={isBooking}
                className="w-full h-10 sm:h-11 text-xs sm:text-sm"
                size="lg"
              >
                <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                {isBooking ? t.booking : t.book}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
