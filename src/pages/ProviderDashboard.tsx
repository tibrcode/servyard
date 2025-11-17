import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { ProviderLogo } from "@/components/provider/ProviderLogo";
import { StatsOverview } from "@/components/provider/StatsOverview";
import { ServiceManagement } from "@/components/provider/ServiceManagement";
import { OffersManagement } from "@/components/provider/OffersManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import {
  Calendar,
  Star,
  Users,
  Clock,
  Settings,
  Plus,
  LogOut,
  Bell,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { auth, db } from "@/integrations/firebase/client";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, getDocs, query, where, updateDoc, onSnapshot } from "firebase/firestore";
import { useTranslation } from "@/lib/i18n";
import { toast } from "@/hooks/use-toast";
import { ShareProfile } from "@/components/provider/ShareProfile";
import { BookingManagement } from "@/components/booking/BookingManagement";
import { Settings as SettingsComponent } from "@/components/settings/Settings";

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
  const location = useLocation();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [providerProfile, setProviderProfile] = useState<Profile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [confirmedBookingsCount, setConfirmedBookingsCount] = useState(0);
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Highlight booking if bookingId query param present (for provider)
  // IMPORTANT: Hooks must run before any early returns to avoid React error #310.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const bookingId = params.get('bookingId');
    if (!bookingId) return;
    const t = setTimeout(() => {
      const el = document.querySelector(`#provider-booking-${bookingId}`) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-primary');
        const clear = () => {
          el.classList.remove('ring-2');
          el.classList.remove('ring-primary');
          el.removeEventListener('click', clear);
          el.removeEventListener('keydown', clear);
          el.removeEventListener('touchstart', clear);
        };
        el.addEventListener('click', clear, { once: true });
        el.addEventListener('keydown', clear, { once: true });
        el.addEventListener('touchstart', clear, { once: true });
        setTimeout(clear, 30000);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [location.search]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        loadProviderData(user);
        
        // Setup real-time listener for bookings
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('provider_id', '==', user.uid)
        );
        
        const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
          const bookingsData = snapshot.docs.map(doc => doc.data());
          
          // Count confirmed bookings
          const confirmedCount = bookingsData.filter(
            (booking: any) => booking.status === 'confirmed'
          ).length;
          setConfirmedBookingsCount(confirmedCount);
          
          // Count pending bookings
          const pendingCount = bookingsData.filter(
            (booking: any) => booking.status === 'pending'
          ).length;
          setPendingBookingsCount(pendingCount);
        });
        
        return () => {
          unsubscribeBookings();
        };
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
    <div className="min-h-screen flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-8">
          {/* Logo and title section */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0 w-full max-w-full">
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

          {/* Online status and buttons row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
            <div className="flex items-center gap-3">
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

            <div className="flex flex-wrap gap-2 flex-1 sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/edit-profile')}
                className="flex items-center gap-2 whitespace-normal break-words leading-tight min-w-0 flex-1 sm:flex-initial bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Settings className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="break-words text-xs sm:text-sm">{t.userInterface.editProfile}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2 whitespace-normal break-words leading-tight min-w-0 flex-1 sm:flex-initial bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="break-words text-xs sm:text-sm">{t.userInterface.logout}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-8">
          <Card className="h-auto">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-xs sm:text-sm font-medium break-words leading-tight min-w-0 flex-1 hyphens-auto">{t.provider.services}</CardTitle>
                <Settings className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-base sm:text-xl lg:text-2xl font-bold leading-tight break-words mb-1">{activeServices.length}</div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words hyphens-auto">
                {t.provider.activeServices}
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
              <div className="text-base sm:text-xl lg:text-2xl font-bold leading-tight break-words mb-1">{averageRating}</div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words hyphens-auto">
                {reviews.length} {t.provider.reviews}
              </p>
            </CardContent>
          </Card>

          <Card className="h-auto">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-xs sm:text-sm font-medium break-words leading-tight min-w-0 flex-1 hyphens-auto">{isRTL ? 'حجوزات مفعلة' : 'Active'}</CardTitle>
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0 mt-0.5" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-base sm:text-xl lg:text-2xl font-bold leading-tight break-words mb-1">{confirmedBookingsCount}</div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words hyphens-auto">
                {isRTL ? 'حجوزات مفعّلة' : 'Active Bookings'}
              </p>
            </CardContent>
          </Card>

          <Card className="h-auto">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-xs sm:text-sm font-medium break-words leading-tight min-w-0 flex-1 hyphens-auto">{t.provider.pendingBookings}</CardTitle>
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-base sm:text-xl lg:text-2xl font-bold leading-tight break-words mb-1">{pendingBookingsCount}</div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words hyphens-auto">
                {isRTL ? 'بانتظار التأكيد' : 'Awaiting Confirmation'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Tabs - With proper spacing from content */}
        <div className="space-y-4">
          <Tabs defaultValue="services" className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-6">
              <TabsTrigger value="services" className="text-xs sm:text-sm">{t.provider.services}</TabsTrigger>
              <TabsTrigger value="offers" className="text-xs sm:text-sm">{t.provider.offers}</TabsTrigger>
              <TabsTrigger value="bookings" className="text-xs sm:text-sm">{t.provider.bookings}</TabsTrigger>
              <TabsTrigger value="appointments" className="text-xs sm:text-sm">{t.provider.pendingBookings}</TabsTrigger>
              <TabsTrigger value="share" className="text-xs sm:text-sm">{t.provider.shareProfile}</TabsTrigger>
              <TabsTrigger value="settings" className="text-xs sm:text-sm">{isRTL ? 'إعدادات' : 'Settings'}</TabsTrigger>
            </TabsList>

            {/* Services Tab */}
            <TabsContent value="services">
              <ServiceManagement currentLanguage={currentLanguage} currencyCode={providerProfile.currency_code} />
            </TabsContent>

            {/* Appointments Tab - Pending Bookings Only */}
            <TabsContent value="appointments">
              {providerProfile && (
                <BookingManagement
                  providerId={providerProfile.id}
                  language={currentLanguage as 'en' | 'ar'}
                  defaultStatusFilter="pending"
                  showOnlyPending={true}
                />
              )}
            </TabsContent>

            {/* Bookings Tab - All Bookings (New System) */}
            <TabsContent value="bookings" className="space-y-4">
              {providerProfile && (
                <BookingManagement
                  providerId={providerProfile.id}
                  language={currentLanguage as 'en' | 'ar'}
                />
              )}
            </TabsContent>

            {/* Offers Tab */}
            <TabsContent value="offers">
              <OffersManagement
                currentLanguage={currentLanguage}
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

            {/* Settings Tab - Notification Preferences & Backup */}
            <TabsContent value="settings" className="space-y-6">
              {providerProfile && (
                <SettingsComponent
                  userId={providerProfile.id}
                  userType="provider"
                  language={currentLanguage as 'en' | 'ar'}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer currentLanguage={currentLanguage} />
    </div>
  );
};

export default ProviderDashboard;