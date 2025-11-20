// Service Booking Component for Customers
// مكون حجز الخدمة للعملاء

import { useState, useEffect, useCallback } from 'react';
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
  updateBooking,
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
  existingBookingId?: string; // For edit mode
  initialDate?: Date; // Pre-selected date for edit
  initialTimes?: string[]; // Pre-selected times for edit
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
  existingBookingId,
  initialDate,
  initialTimes = [],
}: ServiceBookingProps) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || undefined);
  const [selectedTimes, setSelectedTimes] = useState<string[]>(initialTimes);
  const [availability, setAvailability] = useState<DailyAvailability | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(initialDate ? 2 : 1); // Start at step 2 if editing

  const isRTL = language === 'ar';
  const dateLocale = language === 'ar' ? ar : enUS;
  
  // Debug price
  console.log('💰 ServiceBooking price prop:', price);

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

  const loadAvailability = useCallback(async (date: Date) => {
    setIsLoadingSlots(true);
    // Clear selected times when loading new date
    setSelectedTimes([]);
    
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

      // Filter out current booking if in edit mode
      const filteredBookings = existingBookingId 
        ? bookings.filter(b => b.booking_id !== existingBookingId)
        : bookings;

      // Calculate availability
      const dailyAvailability = getDailyAvailability(
        dateString,
        schedule,
        filteredBookings,
        bookingSettings,
        providerTimezone
      );

      console.log('✅ Availability calculated:', dailyAvailability);

      setAvailability(dailyAvailability);
      
      // Restore initial times if in edit mode and same date
      if (existingBookingId && initialDate && formatDate(date) === formatDate(initialDate) && initialTimes.length > 0) {
        setSelectedTimes(initialTimes);
      }
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
  }, [serviceId, existingBookingId, bookingSettings, providerTimezone, initialDate, initialTimes, isRTL, toast]);

  // Load availability when date changes
  useEffect(() => {
    if (selectedDate) {
      loadAvailability(selectedDate);
    }
  }, [selectedDate, existingBookingId, loadAvailability]);

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
    if (!availability) return;

    const slots = availability.slots;
    const clickedIndex = slots.findIndex(s => s.time === time);
    if (clickedIndex === -1 || !slots[clickedIndex].available) return;

    // If already selected, deselect it
    if (selectedTimes.includes(time)) {
      const newSelection = selectedTimes.filter(t => t !== time);
      
      if (newSelection.length === 0) {
        setSelectedTimes([]);
        return;
      }

      // Check continuity after removal
      const indices = newSelection.map(t => slots.findIndex(s => s.time === t)).sort((a, b) => a - b);
      let isConsecutive = true;
      for (let i = 0; i < indices.length - 1; i++) {
        if (indices[i+1] !== indices[i] + 1) {
          isConsecutive = false;
          break;
        }
      }

      if (isConsecutive) {
        setSelectedTimes(newSelection);
      } else {
        // If removing causes discontinuity, clear selection
        setSelectedTimes([]);
      }
      return;
    }

    // If no slots selected yet, start fresh
    if (selectedTimes.length === 0) {
      setSelectedTimes([time]);
      return;
    }

    // Get current selection indices (sorted)
    const selectedIndices = selectedTimes.map(t => slots.findIndex(s => s.time === t)).sort((a, b) => a - b);
    const firstIndex = selectedIndices[0];
    const lastIndex = selectedIndices[selectedIndices.length - 1];

    // Check if clicked slot is adjacent to current selection
    if (clickedIndex === lastIndex + 1) {
      // Check all slots between last and clicked are available
      let allAvailable = true;
      for (let i = lastIndex + 1; i <= clickedIndex; i++) {
        if (!slots[i].available) {
          allAvailable = false;
          break;
        }
      }
      
      if (allAvailable) {
        // Add to end of selection
        const sortedTimes = [...selectedTimes, time]
          .map(t => ({ time: t, index: slots.findIndex(s => s.time === t) }))
          .filter(item => item.index !== -1)
          .sort((a, b) => a.index - b.index)
          .map(item => item.time);
        setSelectedTimes(sortedTimes);
      } else {
        // Start new selection
        setSelectedTimes([time]);
      }
    } else if (clickedIndex === firstIndex - 1) {
      // Check all slots between clicked and first are available
      let allAvailable = true;
      for (let i = clickedIndex; i < firstIndex; i++) {
        if (!slots[i].available) {
          allAvailable = false;
          break;
        }
      }
      
      if (allAvailable) {
        // Add to start of selection
        const sortedTimes = [time, ...selectedTimes]
          .map(t => ({ time: t, index: slots.findIndex(s => s.time === t) }))
          .filter(item => item.index !== -1)
          .sort((a, b) => a.index - b.index)
          .map(item => item.time);
        setSelectedTimes(sortedTimes);
      } else {
        // Start new selection
        setSelectedTimes([time]);
      }
    } else {
      // Not adjacent, start new selection
      setSelectedTimes([time]);
    }
  };

  const handleBooking = async () => {
    if (!selectedDate || selectedTimes.length === 0) return;

    setIsBooking(true);
    try {
      const dateString = formatDate(selectedDate);
      // Sort times to be safe
      const sortedTimes = [...selectedTimes].sort();
      const startTime = sortedTimes[0];
      const lastTime = sortedTimes[sortedTimes.length - 1];
      const endTime = calculateEndTime(lastTime, bookingSettings.duration_minutes);
      const totalPrice = (price || 0) * selectedTimes.length;

      if (existingBookingId) {
        // Update existing booking
        await updateBooking(existingBookingId, {
          booking_date: dateString,
          start_time: startTime,
          end_time: endTime,
          price: totalPrice,
          notes,
        });

        toast({
          title: isRTL ? 'تم التحديث' : 'Updated',
          description: isRTL ? 'تم تحديث الحجز بنجاح' : 'Booking updated successfully',
        });

        if (onBookingComplete) {
          onBookingComplete(existingBookingId);
        }
      } else {
        // Create new booking
        const bookingData = {
          service_id: serviceId,
          provider_id: providerId,
          customer_id: customerId,
          customer_name: customerName,
          customer_phone: customerPhone,
          service_title: serviceTitle,
          booking_date: dateString,
          start_time: startTime,
          end_time: endTime,
          status: bookingSettings.require_confirmation ? ('pending' as const) : ('confirmed' as const),
          price: totalPrice,
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
      }
    } catch (error) {
      console.error('Error creating/updating booking:', error);
      toast({
        title: t.failed,
        description: isRTL 
          ? 'حدث خطأ أثناء ' + (existingBookingId ? 'تحديث' : 'إنشاء') + ' الحجز' 
          : 'An error occurred while ' + (existingBookingId ? 'updating' : 'creating') + ' booking',
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
        <CardContent className="px-2 sm:px-6 py-2 sm:py-6 space-y-3 sm:space-y-6">
          {/* Step 1: Select Date */}
          {step === 1 && (
            <div className="space-y-3 sm:space-y-4 w-full">
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
              <div className="w-full flex justify-center scale-90 sm:scale-100">
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
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 w-full">
                    {availability.slots.map((slot) => {
                      const isSelected = selectedTimes.includes(slot.time);
                      return (
                        <Button
                          key={slot.time}
                          variant={isSelected ? 'default' : (slot.available ? 'outline' : 'ghost')}
                          disabled={!slot.available}
                          onClick={() => handleTimeSelect(slot.time)}
                          className={cn(
                            "flex flex-col h-auto py-2 sm:py-3 px-2 text-xs sm:text-sm transition-all",
                            isSelected && "ring-2 ring-primary ring-offset-2"
                          )}
                        >
                          <span className="font-medium text-xs sm:text-sm">
                            {formatTimeDisplay(slot.time, language)}
                          </span>
                          <span className="text-[10px] sm:text-xs mt-1">
                            {getSlotBadge(slot)}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button 
                      onClick={() => setStep(3)} 
                      disabled={selectedTimes.length === 0}
                      className="w-full sm:w-auto"
                    >
                      {isRTL ? 'التالي' : 'Next'}
                      {selectedTimes.length > 0 && ` (${selectedTimes.length})`}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && selectedDate && selectedTimes.length > 0 && (
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
                      {(() => {
                        const sortedTimes = [...selectedTimes].sort();
                        const start = sortedTimes[0];
                        const end = calculateEndTime(sortedTimes[sortedTimes.length - 1], bookingSettings.duration_minutes);
                        return `${formatTimeDisplay(start, language)} - ${formatTimeDisplay(end, language)}`;
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm gap-2">
                    <span className="text-muted-foreground">{t.duration}:</span>
                    <span className="font-medium">
                      {bookingSettings.duration_minutes * selectedTimes.length} {t.minutes}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm sm:text-base gap-2">
                    <span className="text-muted-foreground">{t.price}:</span>
                    <span className="font-semibold">
                      {((price || 0) * selectedTimes.length).toFixed(2)} {currency}
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
