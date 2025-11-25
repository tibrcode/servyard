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
  CheckCircle2,
  AlertCircle,
  Megaphone,
  Share2,
  Bell,
  Map as MapIcon
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { auth } from "@/integrations/firebase/client";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useTranslation } from "@/lib/i18n";
import { toast } from "@/hooks/use-toast";
import { ShareProfile } from "@/components/provider/ShareProfile";
import { BookingManagement } from "@/components/booking/BookingManagement";
import { Settings as SettingsComponent } from "@/components/settings/Settings";
import { useProviderActions } from "@/hooks/useProviderActions";

import { Service, Offer } from "@/types/service";
import { useProviderDashboardData } from "@/hooks/useProviderDashboardData";
import { useServiceCategories } from "@/hooks/useServiceCategories";

interface ProviderDashboardProps {
  currentLanguage: string;
}

const ProviderDashboard = ({ currentLanguage }: ProviderDashboardProps) => {
  const navigate = useNavigate();
  const { t, isRTL } = useTranslation(currentLanguage);
  const location = useLocation();

  const [currentUser, setCurrentUser] = useState<any>(null);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const { 
    profile: providerProfile, 
    services, 
    offers, 
    reviews, 
    confirmedBookingsCount, 
    pendingBookingsCount, 
    isLoading 
  } = useProviderDashboardData(currentUser?.uid);

  const { data: categories = [] } = useServiceCategories();
  const category = providerProfile ? categories.find(c => c.id === providerProfile.main_category_id) : null;

  const { updateOnlineStatus } = useProviderActions();

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
      await updateOnlineStatus.mutateAsync({ uid: currentUser.uid, isOnline });

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
              categoryIconName={category?.icon_name}
              categoryColorScheme={category?.color_scheme}
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
        <div className="grid grid-cols-4 gap-1 sm:gap-3 mb-6 sm:mb-8">
          <Card className="h-auto bg-muted/50 hover:bg-muted/70 transition-colors">
            <CardHeader className="p-2 sm:p-6 pb-1 sm:pb-2">
              <div className="flex flex-col items-center text-center gap-1 sm:gap-2">
                <div className="bg-blue-100 p-1.5 sm:p-3 rounded-full">
                  <Settings className="h-3 w-3 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <CardTitle className="text-[10px] sm:text-sm font-medium leading-tight">{t.provider.services}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0 sm:pt-0">
              <div className="text-center">
                <div className="text-sm sm:text-xl lg:text-2xl font-bold mb-0 sm:mb-1">{activeServices.length}</div>
                <p className="text-[9px] sm:text-xs text-muted-foreground hidden sm:block">
                  {t.provider.activeServices}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="h-auto bg-muted/50 hover:bg-muted/70 transition-colors">
            <CardHeader className="p-2 sm:p-6 pb-1 sm:pb-2">
              <div className="flex flex-col items-center text-center gap-1 sm:gap-2">
                <div className="bg-purple-100 p-1.5 sm:p-3 rounded-full">
                  <Star className="h-3 w-3 sm:h-5 sm:w-5 text-purple-600" />
                </div>
                <CardTitle className="text-[10px] sm:text-sm font-medium leading-tight">{t.provider.rating}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0 sm:pt-0">
              <div className="text-center">
                <div className="text-sm sm:text-xl lg:text-2xl font-bold mb-0 sm:mb-1">{averageRating}</div>
                <p className="text-[9px] sm:text-xs text-muted-foreground hidden sm:block">
                  {reviews.length} {t.provider.reviews}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="h-auto bg-muted/50 hover:bg-muted/70 transition-colors">
            <CardHeader className="p-2 sm:p-6 pb-1 sm:pb-2">
              <div className="flex flex-col items-center text-center gap-1 sm:gap-2">
                <div className="bg-green-100 p-1.5 sm:p-3 rounded-full">
                  <CheckCircle2 className="h-3 w-3 sm:h-5 sm:w-5 text-green-600" />
                </div>
                <CardTitle className="text-[10px] sm:text-sm font-medium leading-tight">{t.dashboardCommon?.active || 'Active'}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0 sm:pt-0">
              <div className="text-center">
                <div className="text-sm sm:text-xl lg:text-2xl font-bold mb-0 sm:mb-1">{confirmedBookingsCount}</div>
                <p className="text-[9px] sm:text-xs text-muted-foreground hidden sm:block">
                  {t.dashboardCommon?.activeBookings || 'Active Bookings'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="h-auto bg-muted/50 hover:bg-muted/70 transition-colors">
            <CardHeader className="p-2 sm:p-6 pb-1 sm:pb-2">
              <div className="flex flex-col items-center text-center gap-1 sm:gap-2">
                <div className="bg-yellow-100 p-1.5 sm:p-3 rounded-full">
                  <AlertCircle className="h-3 w-3 sm:h-5 sm:w-5 text-yellow-600" />
                </div>
                <CardTitle className="text-[10px] sm:text-sm font-medium leading-tight">{t.dashboardCommon?.pending || 'Pending'}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0 sm:pt-0">
              <div className="text-center">
                <div className="text-sm sm:text-xl lg:text-2xl font-bold mb-0 sm:mb-1">{pendingBookingsCount}</div>
                <p className="text-[9px] sm:text-xs text-muted-foreground hidden sm:block">
                  {t.dashboardCommon?.awaitingConfirmation || 'Awaiting Confirmation'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Tabs - With proper spacing from content */}
        <div className="space-y-4">
          <Tabs defaultValue="services" className="w-full">
            <TabsList className="grid w-full grid-cols-3 gap-4 h-auto bg-transparent p-0 mb-6 md:grid-cols-6 md:bg-muted md:p-1 md:rounded-lg md:gap-2">
              <TabsTrigger 
                value="services" 
                className="relative rounded-2xl border border-border bg-card aspect-square overflow-hidden glow-card transition-transform hover:scale-[1.01] min-w-0 p-0 data-[state=active]:ring-2 data-[state=active]:ring-primary data-[state=active]:border-primary md:aspect-auto md:h-auto md:rounded-md md:border-0 md:bg-transparent md:shadow-none md:hover:scale-100 md:data-[state=active]:ring-0 md:data-[state=active]:bg-background md:data-[state=active]:shadow-sm md:py-2"
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 gap-2 min-w-0 md:static md:flex-row md:gap-2 md:p-0">
                  <div className="opacity-90 flex-shrink-0 md:opacity-100">
                    <Settings className="h-6 w-6 sm:h-8 sm:w-8 md:h-4 md:w-4" />
                  </div>
                  <span className="block mx-auto text-center font-medium text-foreground w-full px-1 leading-tight tracking-normal text-[10px] sm:text-xs whitespace-normal md:w-auto md:text-sm md:mx-0">
                    {t.provider.services}
                  </span>
                </div>
              </TabsTrigger>

              <TabsTrigger 
                value="offers" 
                className="relative rounded-2xl border border-border bg-card aspect-square overflow-hidden glow-card transition-transform hover:scale-[1.01] min-w-0 p-0 data-[state=active]:ring-2 data-[state=active]:ring-primary data-[state=active]:border-primary md:aspect-auto md:h-auto md:rounded-md md:border-0 md:bg-transparent md:shadow-none md:hover:scale-100 md:data-[state=active]:ring-0 md:data-[state=active]:bg-background md:data-[state=active]:shadow-sm md:py-2"
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 gap-2 min-w-0 md:static md:flex-row md:gap-2 md:p-0">
                  <div className="opacity-90 flex-shrink-0 md:opacity-100">
                    <Megaphone className="h-6 w-6 sm:h-8 sm:w-8 md:h-4 md:w-4" />
                  </div>
                  <span className="block mx-auto text-center font-medium text-foreground w-full px-1 leading-tight tracking-normal text-[10px] sm:text-xs whitespace-normal md:w-auto md:text-sm md:mx-0">
                    {t.provider.offers}
                  </span>
                </div>
              </TabsTrigger>

              <TabsTrigger 
                value="bookings" 
                className="relative rounded-2xl border border-border bg-card aspect-square overflow-hidden glow-card transition-transform hover:scale-[1.01] min-w-0 p-0 data-[state=active]:ring-2 data-[state=active]:ring-primary data-[state=active]:border-primary md:aspect-auto md:h-auto md:rounded-md md:border-0 md:bg-transparent md:shadow-none md:hover:scale-100 md:data-[state=active]:ring-0 md:data-[state=active]:bg-background md:data-[state=active]:shadow-sm md:py-2"
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 gap-2 min-w-0 md:static md:flex-row md:gap-2 md:p-0">
                  <div className="opacity-90 flex-shrink-0 md:opacity-100">
                    <Calendar className="h-6 w-6 sm:h-8 sm:w-8 md:h-4 md:w-4" />
                  </div>
                  <span className="block mx-auto text-center font-medium text-foreground w-full px-1 leading-tight tracking-normal text-[10px] sm:text-xs whitespace-normal md:w-auto md:text-sm md:mx-0">
                    {t.provider.bookings}
                  </span>
                </div>
              </TabsTrigger>

              <TabsTrigger 
                value="appointments" 
                className="relative rounded-2xl border border-border bg-card aspect-square overflow-hidden glow-card transition-transform hover:scale-[1.01] min-w-0 p-0 data-[state=active]:ring-2 data-[state=active]:ring-primary data-[state=active]:border-primary md:aspect-auto md:h-auto md:rounded-md md:border-0 md:bg-transparent md:shadow-none md:hover:scale-100 md:data-[state=active]:ring-0 md:data-[state=active]:bg-background md:data-[state=active]:shadow-sm md:py-2"
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 gap-2 min-w-0 md:static md:flex-row md:gap-2 md:p-0">
                  <div className="opacity-90 flex-shrink-0 md:opacity-100">
                    <Clock className="h-6 w-6 sm:h-8 sm:w-8 md:h-4 md:w-4" />
                  </div>
                  <span className="block mx-auto text-center font-medium text-foreground w-full px-1 leading-tight tracking-normal text-[10px] sm:text-xs whitespace-normal md:w-auto md:text-sm md:mx-0">
                    {t.provider.pendingBookings}
                  </span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="share" 
                className="relative rounded-2xl border border-border bg-card aspect-square overflow-hidden glow-card transition-transform hover:scale-[1.01] min-w-0 p-0 data-[state=active]:ring-2 data-[state=active]:ring-primary data-[state=active]:border-primary md:aspect-auto md:h-auto md:rounded-md md:border-0 md:bg-transparent md:shadow-none md:hover:scale-100 md:data-[state=active]:ring-0 md:data-[state=active]:bg-background md:data-[state=active]:shadow-sm md:py-2"
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 gap-2 min-w-0 md:static md:flex-row md:gap-2 md:p-0">
                  <div className="opacity-90 flex-shrink-0 md:opacity-100">
                    <Share2 className="h-6 w-6 sm:h-8 sm:w-8 md:h-4 md:w-4" />
                  </div>
                  <span className="block mx-auto text-center font-medium text-foreground w-full px-1 leading-tight tracking-normal text-[10px] sm:text-xs whitespace-normal md:w-auto md:text-sm md:mx-0">
                    {t.provider.shareProfile}
                  </span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="relative rounded-2xl border border-border bg-card aspect-square overflow-hidden glow-card transition-transform hover:scale-[1.01] min-w-0 p-0 data-[state=active]:ring-2 data-[state=active]:ring-primary data-[state=active]:border-primary md:aspect-auto md:h-auto md:rounded-md md:border-0 md:bg-transparent md:shadow-none md:hover:scale-100 md:data-[state=active]:ring-0 md:data-[state=active]:bg-background md:data-[state=active]:shadow-sm md:py-2"
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 gap-2 min-w-0 md:static md:flex-row md:gap-2 md:p-0">
                  <div className="opacity-90 flex-shrink-0 md:opacity-100">
                    <Settings className="h-6 w-6 sm:h-8 sm:w-8 md:h-4 md:w-4" />
                  </div>
                  <span className="block mx-auto text-center font-medium text-foreground w-full px-1 leading-tight tracking-normal text-[10px] sm:text-xs whitespace-normal md:w-auto md:text-sm md:mx-0">
                    {t.dashboardCommon?.settings || 'Settings'}
                  </span>
                </div>
              </TabsTrigger>
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
                  currencyCode={providerProfile.currency_code}
                />
              )}
            </TabsContent>

            {/* Bookings Tab - All Bookings (New System) */}
            <TabsContent value="bookings" className="space-y-4">
              {providerProfile && (
                <BookingManagement
                  providerId={providerProfile.id}
                  language={currentLanguage as 'en' | 'ar'}
                  currencyCode={providerProfile.currency_code}
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