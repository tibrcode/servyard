import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { ProviderLogo } from "@/components/provider/ProviderLogo";
import { StatsOverview } from "@/components/provider/StatsOverview";
import { ServiceManagement } from "@/components/provider/ServiceManagement";
import { AvailabilityManagement } from "@/components/provider/AvailabilityManagement";
import { OffersManagement } from "@/components/provider/OffersManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import {
  Calendar,
  MessageCircle,
  Star,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Settings,
  Plus,
  LogOut,
  Check,
  X,
  Phone
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { auth, db } from "@/integrations/firebase/client";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, getDocs, query, where, updateDoc } from "firebase/firestore";
import { useTranslation } from "@/lib/i18n";
import { toast } from "@/hooks/use-toast";
import { ShareProfile } from "@/components/provider/ShareProfile";

interface ProviderDashboardProps {
  currentLanguage: string;
}

interface Offer {
  id: string;
  title: string;
  description: string;
  discount_percentage?: number;
  discount_amount?: number;
  valid_until: string;
  is_active: boolean;
  created_at: any;
}

interface Service {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  approximate_price?: string;
  duration_minutes?: number;
  category_id?: string;
  price_range?: string;
  specialty_description?: string;
  created_at?: any;
  updated_at?: any;
}

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  customer_notes?: string;
  service_id: string;
  customer_id: string;
  created_at: any;
  // Customer information populated from customer profile
  customer_name?: string;
  customer_phone_numbers?: string[];
  customer_whatsapp?: string;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone_numbers?: string[];
  whatsapp_number?: string;
  city: string;
  country: string;
  user_type: string;
  is_online?: boolean;
  profile_description?: string;
  currency_code?: string;
}

interface Review {
  id: string;
  rating: number;
  comment?: string;
  customer_id: string;
  provider_id: string;
  service_id: string;
  booking_id: string;
  created_at: any;
  // Customer information populated from customer profile
  customer_name?: string;
}

const ProviderDashboard = ({ currentLanguage }: ProviderDashboardProps) => {
  const navigate = useNavigate();
  const { t, isRTL } = useTranslation(currentLanguage);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [providerProfile, setProviderProfile] = useState<Profile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        loadProviderData(user);
      } else {
        setCurrentUser(null);
        setProviderProfile(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadProviderData = async (user: any) => {
    try {
      // Load provider profile
      const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
      if (profileDoc.exists()) {
        const profileData = { id: profileDoc.id, ...profileDoc.data() } as Profile;

        // Check if user is a provider
        if (profileData.user_type !== 'provider') {
          setProviderProfile(null);
          setIsLoading(false);
          return;
        }

        setProviderProfile(profileData);

        // Load services
        const servicesQuery = query(
          collection(db, 'services'),
          where('provider_id', '==', user.uid)
        );
        const servicesSnapshot = await getDocs(servicesQuery);
        const servicesData = servicesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Service[];
        setServices(servicesData);

        // Load bookings
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('provider_id', '==', user.uid)
        );
        const bookingsSnapshot = await getDocs(bookingsQuery);
        const bookingsData = await Promise.all(
          bookingsSnapshot.docs.map(async (bookingDoc) => {
            const bookingData = { id: bookingDoc.id, ...bookingDoc.data() } as any;

            // Load customer information
            try {
              const customerDoc = await getDoc(doc(db, 'profiles', bookingData.customer_id));
              if (customerDoc.exists()) {
                const customerData = customerDoc.data();
                bookingData.customer_name = customerData.full_name;
                bookingData.customer_phone_numbers = customerData.phone_numbers;
                bookingData.customer_whatsapp = customerData.whatsapp_number;
              }
            } catch (error) {
              console.error('Error loading customer data for booking:', bookingData.id, error);
            }

            return bookingData;
          })
        );
        setBookings(bookingsData as Booking[]);

        // Load offers
        const offersQuery = query(
          collection(db, 'offers'),
          where('provider_id', '==', user.uid)
        );
        const offersSnapshot = await getDocs(offersQuery);
        const offersData = offersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Offer[];
        setOffers(offersData);

        // Load reviews
        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('provider_id', '==', user.uid)
        );
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const reviewsData = reviewsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Review[];
        setReviews(reviewsData);
      }
    } catch (error) {
      console.error('Error loading provider data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!providerProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">{t.ui.accessDenied}</h1>
        <p className="text-muted-foreground">{t.ui.providerAccessRequired}</p>
      </div>
    );
  }

  const activeServices = services.filter(service => service.is_active);
  const pendingBookings = bookings.filter(booking => booking.status === 'pending');
  const completedBookings = bookings.filter(booking => booking.status === 'completed');
  const totalRevenue = completedBookings.length * 150; // Placeholder calculation

  // Calculate average rating
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleBookingAction = async (bookingId: string, action: 'confirmed' | 'rejected' | 'completed') => {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status: action,
        updated_at: new Date()
      });

      // Update local state
      setBookings(bookings.map(booking =>
        booking.id === bookingId
          ? { ...booking, status: action }
          : booking
      ));

      toast({
        title: action === 'confirmed' ? t.toast.bookingConfirmed :
          action === 'rejected' ? t.toast.bookingRejected :
            t.toast.bookingCompleted,
        description: action === 'confirmed' ? t.toast.bookingConfirmedDesc :
          action === 'rejected' ? t.toast.bookingRejectedDesc :
            t.toast.bookingCompletedDesc,
      });
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: t.toast.bookingError,
        description: t.toast.bookingErrorDesc,
        variant: 'destructive',
      });
    }
  };

  const handleOnlineStatusChange = async (isOnline: boolean) => {
    if (!currentUser) return;

    try {
      const profileRef = doc(db, 'profiles', currentUser.uid);
      await updateDoc(profileRef, {
        is_online: isOnline,
        updated_at: new Date()
      });

      // Update local state
      setProviderProfile(prev => prev ? { ...prev, is_online: isOnline } : null);

      toast({
        title: isOnline ? t.toast.onlineStatus : t.toast.offlineStatus,
        description: isOnline ? t.toast.onlineStatusDesc : t.toast.offlineStatusDesc,
      });
    } catch (error) {
      console.error('Error updating online status:', error);
      toast({
        title: t.toast.error,
        description: t.toast.statusUpdateError,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-8">
          {/* Two-column responsive header: left (logo+texts) grows, right (toggles+buttons) auto */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] items-start gap-4 w-full max-w-full">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0 flex-1 w-full max-w-full">
              <ProviderLogo
                providerName={providerProfile.full_name}
                size="lg"
              />
              <div className="min-w-0 flex-1 w-full max-w-full">
                <h1 className="dashboard-title text-xl sm:text-2xl lg:text-3xl font-bold leading-snug max-w-full">{t.provider.dashboard}</h1>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mt-1 w-full max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                  {t.userInterface.welcome},{" "}
                  <span className="provider-name align-baseline">{providerProfile.full_name}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full lg:w-auto lg:justify-self-end min-w-0">
              <div className="flex items-center gap-3 w-full lg:w-auto">
                <Switch
                  checked={providerProfile.is_online || false}
                  onCheckedChange={handleOnlineStatusChange}
                  id="online-status"
                />
                <div className="inline-flex items-center gap-2 rounded-full border bg-secondary/20 px-3 py-1 whitespace-nowrap">
                  <span className={`w-2 h-2 rounded-full ${providerProfile.is_online ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className="text-xs sm:text-sm font-medium">
                    {providerProfile.is_online ? t.userInterface.onlineNow : t.userInterface.offline}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 justify-start lg:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/edit-profile')}
                  className="flex items-center gap-2 whitespace-normal break-words leading-tight min-w-0 flex-1 sm:flex-initial"
                >
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="break-words text-xs sm:text-sm">{t.userInterface.editProfile}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-2 whitespace-normal break-words leading-tight min-w-0 flex-1 sm:flex-initial"
                >
                  <LogOut className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="break-words text-xs sm:text-sm">{t.userInterface.logout}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-8">
          <Card className="h-auto">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-xs sm:text-sm font-medium break-words leading-tight min-w-0 flex-1 hyphens-auto">{t.provider.services}</CardTitle>
                <Settings className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold leading-tight break-words mb-1">{activeServices.length}</div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words hyphens-auto">
                {t.provider.activeServices}
              </p>
            </CardContent>
          </Card>

          <Card className="h-auto">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-xs sm:text-sm font-medium break-words leading-tight min-w-0 flex-1 hyphens-auto">{t.provider.bookings}</CardTitle>
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold leading-tight break-words mb-1">{pendingBookings.length}</div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words hyphens-auto">
                {t.provider.pendingBookings}
              </p>
            </CardContent>
          </Card>

          <Card className="h-auto">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-xs sm:text-sm font-medium break-words leading-tight min-w-0 flex-1 hyphens-auto">{t.provider.revenue}</CardTitle>
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold leading-tight break-words mb-1">{providerProfile.currency_code ? `${providerProfile.currency_code} ` : ''}{totalRevenue}</div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words hyphens-auto">
                {t.provider.thisMonth}
              </p>
            </CardContent>
          </Card>

          <Card className="h-auto">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-xs sm:text-sm font-medium break-words leading-tight min-w-0 flex-1 hyphens-auto">{t.provider.rating}</CardTitle>
                <Star className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold leading-tight break-words mb-1">{averageRating}</div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words hyphens-auto">
                {reviews.length} {t.provider.reviews}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Tabs - With proper spacing from content */}
        <div className="space-y-4">
          <Tabs defaultValue="services" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 mb-6">
              <TabsTrigger value="services">{t.provider.services}</TabsTrigger>
              <TabsTrigger value="bookings">{t.provider.bookings}</TabsTrigger>
              <TabsTrigger value="offers">{t.provider.offers}</TabsTrigger>
              <TabsTrigger value="availability">{t.provider.availability}</TabsTrigger>
              <TabsTrigger value="share">{t.provider.shareProfile}</TabsTrigger>
            </TabsList>

            {/* Services Tab */}
            <TabsContent value="services">
              <ServiceManagement currentLanguage={currentLanguage} currencyCode={providerProfile.currency_code} />
            </TabsContent>

            {/* Bookings Tab */}
            <TabsContent value="bookings" className="space-y-4">
              <div className="w-full max-w-full min-w-0">
                {bookings.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2 leading-snug break-words hyphens-auto">{t.provider.noServicesYet}</h3>
                      <p className="text-muted-foreground leading-relaxed break-words hyphens-auto">{t.provider.createFirstService}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <Card key={booking.id}>
                        <CardContent className="p-4">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="space-y-2 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge
                                  variant={
                                    booking.status === 'pending' ? 'default' :
                                      booking.status === 'confirmed' ? 'secondary' :
                                        booking.status === 'completed' ? 'default' :
                                          'destructive'
                                  }
                                  className={`whitespace-nowrap leading-none px-2.5 py-0.5 hyphens-none ${(booking.status === 'pending' || booking.status === 'completed')
                                    ? 'text-slate-900 dark:text-slate-900'
                                    : ''
                                    }`}
                                >
                                  {t.booking.statuses[booking.status as keyof typeof t.booking.statuses] ?? booking.status}
                                </Badge>
                                <span className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">
                                  {new Date(booking.booking_date).toLocaleDateString(currentLanguage)} • {booking.booking_time}
                                </span>
                              </div>
                              {booking.customer_name && (
                                <p className="text-sm sm:text-base font-semibold leading-snug break-words hyphens-auto">{booking.customer_name}</p>
                              )}
                              {booking.customer_notes && (
                                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words hyphens-auto">{booking.customer_notes}</p>
                              )}
                              <div className="flex gap-2 flex-wrap">
                                {booking.customer_whatsapp && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(`https://wa.me/${booking.customer_whatsapp?.replace(/[^\d]/g, '')}`, '_blank')}
                                    className="flex items-center gap-2 whitespace-normal break-words leading-tight"
                                  >
                                    <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                    <span className="break-words text-xs sm:text-sm">{t.customer.whatsapp}</span>
                                  </Button>
                                )}
                                {booking.customer_phone_numbers && booking.customer_phone_numbers.length > 0 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const dial = booking.customer_phone_numbers?.[0] || '';
                                      const sanitized = dial.replace(/[^\d+]/g, '');
                                      // Use location to ensure opening dialer within WebView
                                      window.location.href = `tel:${sanitized}`;
                                    }}
                                    className="flex items-center gap-2 whitespace-normal break-words leading-tight"
                                  >
                                    <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                    <span className="break-words text-xs sm:text-sm">{t.customer.call}</span>
                                  </Button>
                                )}
                              </div>
                            </div>

                            {booking.status === 'pending' && (
                              <div className="flex gap-2 flex-wrap">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleBookingAction(booking.id, 'confirmed')}
                                  className="flex items-center gap-2 whitespace-normal break-words leading-tight"
                                >
                                  <Check className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                  <span className="break-words text-xs sm:text-sm">{t.booking.confirm}</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleBookingAction(booking.id, 'rejected')}
                                  className="flex items-center gap-2 whitespace-normal break-words leading-tight"
                                >
                                  <X className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                  <span className="break-words text-xs sm:text-sm">{t.booking.reject}</span>
                                </Button>
                              </div>
                            )}

                            {booking.status === 'confirmed' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleBookingAction(booking.id, 'completed')}
                                className="flex items-center gap-2 whitespace-normal break-words leading-tight"
                              >
                                <Check className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span className="break-words text-xs sm:text-sm">{t.booking.completed}</span>
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Offers Tab */}
            <TabsContent value="offers">
              <OffersManagement
                currentLanguage={currentLanguage}
              />
            </TabsContent>

            {/* Availability Tab */}
            <TabsContent value="availability">
              <AvailabilityManagement
                currentLanguage={currentLanguage}
                services={services}
              />
            </TabsContent>

            {/* Share Tab */}
            <TabsContent value="share">
              <ShareProfile
                providerId={providerProfile.id}
                providerName={providerProfile.full_name}
                currentLanguage={currentLanguage}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer currentLanguage={currentLanguage} />
    </div>
  );
};

export default ProviderDashboard;