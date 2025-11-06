// Booking Management Component for Providers
// مكون إدارة الحجوزات لمزود الخدمة

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Booking, BookingStatus, BookingStatistics } from '@/types/booking';
import { getProviderBookings, updateBookingStatus, subscribeToProviderBookings } from '@/lib/firebase/bookingFunctions';
import { formatTimeDisplay, formatDate } from '@/lib/bookingUtils';
import { Calendar, Clock, User, Phone, CheckCircle2, X, AlertCircle, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BookingManagementProps {
  providerId: string;
  language?: 'ar' | 'en';
  defaultStatusFilter?: BookingStatus | 'all';
  showOnlyPending?: boolean;
}

type ViewMode = 'all' | 'today' | 'week' | 'month';

export function BookingManagement({
  providerId,
  language = 'ar',
  defaultStatusFilter = 'all',
  showOnlyPending = false,
}: BookingManagementProps) {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('today');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>(defaultStatusFilter);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const isRTL = language === 'ar';
  const dateLocale = language === 'ar' ? ar : enUS;

  // Translation - Different titles based on mode
  const titleText = showOnlyPending 
    ? (isRTL ? 'المواعيد المعلقة' : 'Pending Appointments')
    : (isRTL ? 'إدارة الحجوزات' : 'Booking Management');
  
  const subtitleText = showOnlyPending
    ? (isRTL ? 'الحجوزات التي تحتاج موافقتك' : 'Bookings awaiting your approval')
    : (isRTL ? 'عرض وإدارة جميع حجوزات خدماتك' : 'View and manage all your service bookings');

  const t = {
    title: titleText,
    subtitle: subtitleText,
    today: isRTL ? 'اليوم' : 'Today',
    week: isRTL ? 'هذا الأسبوع' : 'This Week',
    month: isRTL ? 'هذا الشهر' : 'This Month',
    all: isRTL ? 'الكل' : 'All',
    filterByStatus: isRTL ? 'تصفية حسب الحالة' : 'Filter by Status',
    noBookings: isRTL ? 'لا توجد حجوزات' : 'No bookings found',
    loading: isRTL ? 'جاري التحميل...' : 'Loading...',
    customer: isRTL ? 'العميل' : 'Customer',
    service: isRTL ? 'الخدمة' : 'Service',
    date: isRTL ? 'التاريخ' : 'Date',
    time: isRTL ? 'الوقت' : 'Time',
    price: isRTL ? 'السعر' : 'Price',
    notes: isRTL ? 'ملاحظات' : 'Notes',
    noNotes: isRTL ? 'لا توجد ملاحظات' : 'No notes',
    confirm: isRTL ? 'تأكيد' : 'Confirm',
    reject: isRTL ? 'رفض' : 'Reject',
    cancel: isRTL ? 'إلغاء' : 'Cancel',
    complete: isRTL ? 'إتمام' : 'Complete',
    markNoShow: isRTL ? 'لم يحضر' : 'No Show',
    call: isRTL ? 'اتصال' : 'Call',
    updating: isRTL ? 'جاري التحديث...' : 'Updating...',
    confirmed: isRTL ? 'تم التأكيد' : 'Confirmed',
    rejected: isRTL ? 'تم الرفض' : 'Rejected',
    cancelled: isRTL ? 'تم الإلغاء' : 'Cancelled',
    completed: isRTL ? 'تم الإتمام' : 'Completed',
    updateSuccess: isRTL ? 'تم تحديث الحجز' : 'Booking updated',
    updateFailed: isRTL ? 'فشل التحديث' : 'Update failed',
    statistics: isRTL ? 'الإحصائيات' : 'Statistics',
    totalBookings: isRTL ? 'إجمالي الحجوزات' : 'Total Bookings',
    pendingBookings: isRTL ? 'معلقة' : 'Pending',
    confirmedBookings: isRTL ? 'مؤكدة' : 'Confirmed',
    revenue: isRTL ? 'الإيرادات' : 'Revenue',
    statuses: {
      all: isRTL ? 'الكل' : 'All',
      pending: isRTL ? 'معلق' : 'Pending',
      confirmed: isRTL ? 'مؤكد' : 'Confirmed',
      cancelled: isRTL ? 'ملغي' : 'Cancelled',
      completed: isRTL ? 'مكتمل' : 'Completed',
      'no-show': isRTL ? 'لم يحضر' : 'No Show',
    },
  };

  useEffect(() => {
    setIsLoading(true);
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToProviderBookings(providerId, (data) => {
      setBookings(data);
      setIsLoading(false);
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [providerId]);

  useEffect(() => {
    filterBookings();
  }, [bookings, viewMode, statusFilter, showOnlyPending]);

  const loadBookings = async () => {
    // Kept for manual refresh if needed
    setIsLoading(true);
    try {
      const data = await getProviderBookings(providerId);
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

  const filterBookings = () => {
    let filtered = [...bookings];

    // If showing only pending, override all other filters
    if (showOnlyPending) {
      filtered = filtered.filter(b => b.status === 'pending');
    } else {
      // Filter by date range
      const now = new Date();
      const today = formatDate(now);
      
      if (viewMode === 'today') {
        filtered = filtered.filter(b => b.booking_date === today);
      } else if (viewMode === 'week') {
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        filtered = filtered.filter(b => {
          // Parse date properly
          const [year, month, day] = b.booking_date.split('-').map(Number);
          const bookingDate = new Date(year, month - 1, day);
          return bookingDate >= now && bookingDate <= weekFromNow;
        });
      } else if (viewMode === 'month') {
        const monthFromNow = new Date();
        monthFromNow.setMonth(monthFromNow.getMonth() + 1);
        filtered = filtered.filter(b => {
          // Parse date properly
          const [year, month, day] = b.booking_date.split('-').map(Number);
          const bookingDate = new Date(year, month - 1, day);
          return bookingDate >= now && bookingDate <= monthFromNow;
        });
      }

      // Filter by status
      if (statusFilter !== 'all') {
        filtered = filtered.filter(b => b.status === statusFilter);
      }
    }

    // Sort by date and time (parse properly)
    filtered.sort((a, b) => {
      const [yearA, monthA, dayA] = a.booking_date.split('-').map(Number);
      const [hourA, minuteA] = a.start_time.split(':').map(Number);
      const dateA = new Date(yearA, monthA - 1, dayA, hourA, minuteA);
      
      const [yearB, monthB, dayB] = b.booking_date.split('-').map(Number);
      const [hourB, minuteB] = b.start_time.split(':').map(Number);
      const dateB = new Date(yearB, monthB - 1, dayB, hourB, minuteB);
      
      return dateA.getTime() - dateB.getTime();
    });

    setFilteredBookings(filtered);
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: BookingStatus) => {
    setUpdatingId(bookingId);
    try {
      await updateBookingStatus(bookingId, newStatus);
      
      // Update local state
      setBookings(prev =>
        prev.map(b => (b.booking_id === bookingId ? { ...b, status: newStatus } : b))
      );

      toast({
        title: t.updateSuccess,
        description: isRTL ? 'تم تحديث حالة الحجز بنجاح' : 'Booking status updated successfully',
      });
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: t.updateFailed,
        description: isRTL ? 'حدث خطأ أثناء التحديث' : 'An error occurred while updating',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
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

  const calculateStats = (): BookingStatistics => {
    const filtered = filteredBookings;
    return {
      total_bookings: filtered.length,
      confirmed: filtered.filter(b => b.status === 'confirmed').length,
      pending: filtered.filter(b => b.status === 'pending').length,
      cancelled: filtered.filter(b => b.status === 'cancelled').length,
      completed: filtered.filter(b => b.status === 'completed').length,
      no_show: filtered.filter(b => b.status === 'no-show').length,
      total_revenue: filtered
        .filter(b => b.status === 'completed' || b.status === 'confirmed')
        .reduce((sum, b) => sum + b.price, 0),
      currency: filtered[0]?.currency || 'SAR',
      period: viewMode === 'today' ? 'today' : viewMode === 'week' ? 'week' : viewMode === 'month' ? 'month' : 'all',
    };
  };

  const stats = calculateStats();

  const renderBookingCard = (booking: Booking) => {
    const bookingDate = new Date(booking.booking_date);
    const isUpdating = updatingId === booking.booking_id;

    return (
      <Card key={booking.booking_id}>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{booking.service_title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {booking.customer_name}
                </p>
              </div>
              {getStatusBadge(booking.status)}
            </div>

            <Separator />

            {/* Customer Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{booking.customer_name}</span>
              </div>
              {booking.customer_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`tel:${booking.customer_phone}`}
                    className="text-primary hover:underline"
                  >
                    {booking.customer_phone}
                  </a>
                </div>
              )}
            </div>

            <Separator />

            {/* Booking Details */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{format(bookingDate, 'PPP', { locale: dateLocale })}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {formatTimeDisplay(booking.start_time, language)} -{' '}
                  {formatTimeDisplay(booking.end_time, language)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">
                  {booking.price} {booking.currency}
                </span>
              </div>
            </div>

            {/* Notes */}
            {booking.notes && (
              <>
                <Separator />
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t.notes}:</p>
                  <p className="text-sm">{booking.notes}</p>
                </div>
              </>
            )}

            {/* Actions */}
            {booking.status !== 'cancelled' && booking.status !== 'completed' && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-2">
                  {booking.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(booking.booking_id, 'confirmed')}
                        disabled={isUpdating}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        {t.confirm}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleStatusUpdate(booking.booking_id, 'cancelled')}
                        disabled={isUpdating}
                      >
                        <X className="h-4 w-4 mr-1" />
                        {t.reject}
                      </Button>
                    </>
                  )}
                  {booking.status === 'confirmed' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(booking.booking_id, 'completed')}
                        disabled={isUpdating}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        {t.complete}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(booking.booking_id, 'no-show')}
                        disabled={isUpdating}
                      >
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {t.markNoShow}
                      </Button>
                    </>
                  )}
                </div>
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
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Main Card - Moved to top */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t.title}</CardTitle>
              <CardDescription>{t.subtitle}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters - Hide if showing only pending */}
          {!showOnlyPending && (
            <div className="flex flex-col sm:flex-row gap-4">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="flex-1">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="today">{t.today}</TabsTrigger>
                  <TabsTrigger value="week">{t.week}</TabsTrigger>
                  <TabsTrigger value="month">{t.month}</TabsTrigger>
                  <TabsTrigger value="all">{t.all}</TabsTrigger>
                </TabsList>
              </Tabs>

              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as BookingStatus | 'all')}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder={t.filterByStatus} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.statuses.all}</SelectItem>
                <SelectItem value="pending">{t.statuses.pending}</SelectItem>
                <SelectItem value="confirmed">{t.statuses.confirmed}</SelectItem>
                <SelectItem value="cancelled">{t.statuses.cancelled}</SelectItem>
                <SelectItem value="completed">{t.statuses.completed}</SelectItem>
                <SelectItem value="no-show">{t.statuses['no-show']}</SelectItem>
              </SelectContent>
            </Select>
            </div>
          )}

          {/* Bookings List */}
          <div className="space-y-4">
            {filteredBookings.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">{t.noBookings}</p>
              </div>
            ) : (
              filteredBookings.map(renderBookingCard)
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics - Moved to bottom */}
      {!showOnlyPending && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.totalBookings}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_bookings}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.pendingBookings}</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.confirmedBookings}</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.confirmed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.revenue}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total_revenue} {stats.currency}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
