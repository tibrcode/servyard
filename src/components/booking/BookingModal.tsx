import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, MapPin, Star, Phone, MessageCircle, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/integrations/firebase/client";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/lib/i18n";
import { trackBookingCreated, trackPhoneClick } from "@/lib/firebase/analytics";
import { ServiceBooking } from "@/components/booking/ServiceBooking";
import { withTrace } from '@/lib/trace';
import { BookingSettings } from "@/types/booking";

interface Service {
  id: string;
  name: string;
  description?: string;
  provider_id: string;
  approximate_price?: string;
  duration_minutes?: number;
  price_range?: string;
  booking_enabled?: boolean;
  max_concurrent_bookings?: number;
  advance_booking_days?: number;
  buffer_time_minutes?: number;
  cancellation_policy_hours?: number;
  require_confirmation?: boolean;
  allow_customer_cancellation?: boolean;
}

interface Provider {
  id: string;
  full_name: string;
  city?: string;
  country?: string;
  profile_description?: string;
  phone_numbers?: string[];
  whatsapp_number?: string;
  currency_code?: string;
  timezone?: string;
}

interface BookingModalProps {
  service: Service;
  provider: Provider;
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: string;
}

export const BookingModal = ({ service, provider, isOpen, onClose, currentLanguage }: BookingModalProps) => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { t, isRTL } = useTranslation(currentLanguage);

  const [bookingData, setBookingData] = useState({
    booking_date: '',
    booking_time: '',
    customer_notes: ''
  });

  const handleLoginRedirect = () => {
    onClose();
    navigate('/auth');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        variant: "destructive",
        title: t.ui.accessDenied,
        description: t.ui.loginRequired
      });
      return;
    }

    if (role !== 'customer') {
      toast({
        variant: "destructive",
        title: t.ui.accessDenied,
        description: t.ui.customerAccessRequired
      });
      return;
    }

    if (!bookingData.booking_date || !bookingData.booking_time) {
      toast({
        variant: "destructive",
        title: t.toast.error,
        description: t.ui.missingBookingInfo
      });
      return;
    }

    setLoading(true);

    try {
      // Create booking
      const booking = {
        customer_id: user.uid,
        provider_id: service.provider_id,
        service_id: service.id,
        booking_date: bookingData.booking_date,
        booking_time: bookingData.booking_time,
        status: 'pending',
        customer_notes: bookingData.customer_notes || null,
        provider_response: null,
        cancelled_by: null,
        cancellation_reason: null,
        created_at: new Date(),
        updated_at: new Date()
      };

      const bookingDoc = await addDoc(collection(db, 'bookings'), booking);

      // تتبع الحجز في Analytics
      trackBookingCreated(service.id, service.provider_id, bookingData.booking_date);

      // Send notification to provider
      try {
          await fetch('https://notifynewbooking-btfczcxdyq-uc.a.run.app', withTrace({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: bookingDoc.id,
            booking: booking
          })
          }));
      } catch (notifError) {
        console.error('Error sending booking notification:', notifError);
        // Don't fail the booking if notification fails
      }

      toast({
        title: t.toast.bookingConfirmed,
        description: t.ui.bookingRequestSent
      });

      // Reset form and close modal
      setBookingData({
        booking_date: '',
        booking_time: '',
        customer_notes: ''
      });
      onClose();

    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast({
        variant: "destructive",
        title: t.toast.bookingError,
        description: error.message || t.ui.errorLoadingServices
      });
    } finally {
      setLoading(false);
    }
  };

  // If booking is enabled for this service, use the new booking system
  if (service.booking_enabled && user && role === 'customer') {
    const bookingSettings: BookingSettings = {
      booking_enabled: service.booking_enabled,
      duration_minutes: service.duration_minutes || 30,
      max_concurrent_bookings: service.max_concurrent_bookings || 1,
      advance_booking_days: service.advance_booking_days || 30,
      buffer_time_minutes: service.buffer_time_minutes || 0,
      cancellation_policy_hours: service.cancellation_policy_hours || 24,
      require_confirmation: service.require_confirmation !== undefined ? service.require_confirmation : true,
      allow_customer_cancellation: service.allow_customer_cancellation !== undefined ? service.allow_customer_cancellation : true,
    };

    if (!isOpen) return null;

    return (
      <div 
        className="fixed top-16 bottom-0 inset-x-0 lg:inset-x-auto lg:end-0 lg:start-64 z-30 flex items-center justify-center p-4" 
        dir={isRTL ? 'rtl' : 'ltr'}
        onClick={onClose}
      >
        {/* Semi-transparent overlay - only dims the content area */}
        <div className="absolute inset-0 bg-black/30" />
        
        {/* Modal Content */}
        <div 
          className="relative z-10 w-full max-w-2xl lg:max-w-3xl max-h-[calc(100%-2rem)] bg-card rounded-lg shadow-2xl overflow-hidden flex flex-col border border-border"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2 text-base sm:text-lg truncate">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="truncate font-semibold">{isRTL ? 'حجز موعد' : 'Book Appointment'}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-8 w-8 p-0 rounded-full hover:bg-muted"
            >
              ×
            </Button>
          </div>
          
          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 sm:px-6 py-4 sm:py-6">
              <ServiceBooking
                serviceId={service.id}
                providerId={service.provider_id}
                customerId={user.uid}
                customerName={user.displayName || ''}
                customerPhone={user.phoneNumber || ''}
                serviceTitle={service.name}
                price={parseFloat(service.approximate_price || '0')}
                currency={provider.currency_code || 'AED'}
                bookingSettings={bookingSettings}
                providerTimezone={provider.timezone || 'Asia/Dubai'}
                language={currentLanguage as 'en' | 'ar'}
                onBookingComplete={() => {
                  toast({
                    title: isRTL ? 'تم بنجاح!' : 'Success!',
                    description: isRTL ? 'تم حجز موعدك بنجاح' : 'Your appointment has been booked successfully',
                  });
                  onClose();
                }}
                onBack={onClose}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, use the old direct contact modal
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-background rounded-lg w-full max-w-[95vw] sm:max-w-lg md:max-w-2xl mx-auto max-h-[95vh] overflow-y-auto">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {t.actions.book}
                </CardTitle>
                <p className="text-muted-foreground mt-1">
                  {t.actions.book}: {provider.full_name}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={onClose}>
                ×
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Service Details */}
            <div className="border rounded-lg p-4 card-nested">
              <h3 className="font-semibold text-lg mb-2">{service.name}</h3>
              {service.description && (
                <p className="text-muted-foreground mb-3">{service.description}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm">
                {service.approximate_price && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <span>💰</span>
                    {service.approximate_price}
                  </Badge>
                )}
                {service.duration_minutes && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {service.duration_minutes} min
                  </Badge>
                )}
                {service.price_range && (
                  <Badge variant="outline">
                    {service.price_range}
                  </Badge>
                )}
              </div>
            </div>

            {/* Provider Info */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                  {provider.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h4 className="font-semibold">{provider.full_name}</h4>
                  {(provider.city || provider.country) && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {[provider.city, provider.country].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {provider.whatsapp_number && (
                    <div className="flex items-center gap-2 mt-2">
                      <a
                        href={`https://wa.me/${provider.whatsapp_number.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 transition-colors"
                      >
                        <span>📱</span>
                        WhatsApp: {provider.whatsapp_number}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="flex flex-wrap gap-2">
                {provider.whatsapp_number && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://wa.me/${provider.whatsapp_number.replace(/[^\d]/g, '')}`, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4 text-green-600" />
                    {t.customer.whatsapp}
                  </Button>
                )}
                {provider.phone_numbers && provider.phone_numbers.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`tel:${provider.phone_numbers![0]}`, '_self')}
                    className="flex items-center gap-2"
                  >
                    <Phone className="w-4 h-4 text-blue-600" />
                    {t.customer.call}
                  </Button>
                )}
              </div>
            </div>

            {/* Authentication Check */}
            {!user ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <LogIn className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h4 className="font-semibold text-blue-900 mb-2">{t.ui.accessDenied}</h4>
                <p className="text-blue-800 mb-4">{t.userInterface.welcome}</p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleLoginRedirect} className="bg-blue-600 hover:bg-blue-700">
                    <LogIn className="w-4 h-4 mr-2" />
                    {t.actions.login}
                  </Button>
                  <Button variant="outline" onClick={onClose}>
                    {t.actions.cancel}
                  </Button>
                </div>
              </div>
            ) : role !== 'customer' ? (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
                <User className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                <h4 className="font-semibold text-orange-900 mb-2">{t.ui.accessDenied}</h4>
                <p className="text-orange-800 mb-4">{t.customer.dashboard}</p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => navigate('/customer-signup')} className="bg-orange-600 hover:bg-orange-700">
                    <User className="w-4 h-4 mr-2" />
                    {t.auth.customerSignup}
                  </Button>
                  <Button variant="outline" onClick={onClose}>
                    {t.actions.cancel}
                  </Button>
                </div>
              </div>
            ) : (
              /* Booking Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="booking_date">{t.availability.date}</Label>
                    <Input
                      id="booking_date"
                      type="date"
                      value={bookingData.booking_date}
                      onChange={(e) => setBookingData(prev => ({ ...prev, booking_date: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="booking_time">{t.booking.selectTime}</Label>
                    <Input
                      id="booking_time"
                      type="time"
                      value={bookingData.booking_time}
                      onChange={(e) => setBookingData(prev => ({ ...prev, booking_time: e.target.value }))}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_notes">{t.booking.notes}</Label>
                  <Textarea
                    id="customer_notes"
                    value={bookingData.customer_notes}
                    onChange={(e) => setBookingData(prev => ({ ...prev, customer_notes: e.target.value }))}
                    placeholder={t.editProfile.descriptionPlaceholder}
                    rows={3}
                    disabled={loading}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">{t.customer.manageBookings}</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• {t.ui.bookingRequestSent}</li>
                    <li>• {t.booking.statuses.confirmed}</li>
                    <li>• {t.booking.bookingConfirmed}</li>
                    <li>• {t.footer.paymentDisclaimer}</li>
                  </ul>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1"
                  >
                    {t.actions.cancel}
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t.ui.loading}
                      </>
                    ) : (
                      <>
                        <Calendar className="w-4 h-4 mr-2" />
                        {t.actions.book}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};