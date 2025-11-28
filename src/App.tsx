import React from "react";
import { useTranslation, rtlLanguages as i18nRtl } from "@/lib/i18n";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { db } from "@/integrations/firebase/client";
import { doc, updateDoc } from "firebase/firestore";
import { Header } from "@/components/layout/Header";
import { requestNotificationPermission, onMessageListener } from "@/lib/firebase/notifications";
import { useAuth } from "@/contexts/AuthContext";

// Lazy load all pages for code-splitting and performance optimization
const Index = React.lazy(() => import("@/pages/Index"));
const Auth = React.lazy(() => import("@/pages/Auth"));
const ProviderSignup = React.lazy(() => import("@/pages/ProviderSignup"));
const CustomerSignup = React.lazy(() => import("@/pages/CustomerSignup"));
const Services = React.lazy(() => import("@/pages/Services"));
const ProviderDashboard = React.lazy(() => import('@/pages/ProviderDashboard'));
const CustomerDashboard = React.lazy(() => import('@/pages/CustomerDashboard'));
const AddService = React.lazy(() => import("@/pages/AddService"));
const EditService = React.lazy(() => import("@/pages/EditService"));
const EditProfile = React.lazy(() => import("@/pages/EditProfile"));
const TimezoneSettings = React.lazy(() => import("@/pages/TimezoneSettings"));
const ProviderProfile = React.lazy(() => import("@/pages/ProviderProfile"));
const AdminConsole = React.lazy(() => import('@/pages/AdminConsole'));
const Terms = React.lazy(() => import("@/pages/Terms"));
const CompleteProfile = React.lazy(() => import("@/pages/CompleteProfile"));
const RoleSelection = React.lazy(() => import("@/pages/RoleSelection"));
const Privacy = React.lazy(() => import("@/pages/Privacy"));
const Disclaimer = React.lazy(() => import("@/pages/Disclaimer"));
const ContentPolicy = React.lazy(() => import("@/pages/ContentPolicy"));
const AboutUs = React.lazy(() => import("@/pages/AboutUs"));
const ContactUs = React.lazy(() => import("@/pages/ContactUs"));
const NotFound = React.lazy(() => import("@/pages/NotFound"));
const DebugNotifications = React.lazy(() => import("@/pages/DebugNotifications"));
const NotificationsHistory = React.lazy(() => import("@/pages/NotificationsHistory"));
const Favorites = React.lazy(() => import("@/pages/Favorites"));
const UserGuide = React.lazy(() => import("@/pages/UserGuide"));
const ResetPassword = React.lazy(() => import("@/pages/ResetPassword"));

import { NotificationLogProvider, useNotificationLog } from "@/contexts/NotificationLogContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import EnsureProfile from "@/components/auth/EnsureProfile";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { AdBanner } from "@/components/ads/AdBanner";

const queryClient = new QueryClient();

const AppContent = () => {
  const [currentLanguage, setCurrentLanguage] = React.useState(() => {
    // Get saved language from localStorage or default to English on first run
    const savedLanguage = localStorage.getItem('preferred-language');
    return savedLanguage || 'en';
  });
  const { t } = useTranslation(currentLanguage);
  const { toast } = useToast();
  const { user, role } = useAuth();
  
  // State للموقع الجغرافي
  const [userLocation, setUserLocation] = React.useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // تفعيل الإشعارات عند تسجيل الدخول (Safari-friendly)
  React.useEffect(() => {
    if (user?.uid) {
      // تحقق من الـ permission الحالي بدون طلب
      if ('Notification' in window && Notification.permission === 'granted') {
        // إذا كان granted مسبقاً، احصل على token (بدون prompt)
        requestNotificationPermission(user.uid, true).catch(() => {
          // Silent failure - notifications optional
        });
      }
      // إذا كان 'default' أو 'denied'، لا تفعل شيء - المستخدم يفعلها من settings
    }
  }, [user?.uid]);

  // الاستماع للإشعارات عندما يكون التطبيق مفتوحاً
  const { addNotification } = useNotificationLog();
  React.useEffect(() => {
    const unsubscribe = onMessageListener((payload) => {
      toast({
        title: payload.notification?.title || 'إشعار جديد',
        description: payload.notification?.body,
      });
      try {
        addNotification({
          title: payload.notification?.title || 'Notification',
          body: payload.notification?.body,
          via: 'foreground',
          raw: payload,
          type: payload.data?.type,
          // category derivation happens in context for SW, but here we can pass type only
        });
      } catch {}
    }, { userId: user?.uid });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [toast, addNotification, user?.uid]);

  const closeAllOverlays = () => {
    try {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      // Fallback: click body to close any click-away handlers
      document.body.click();
    } catch { }
  };

  const handleLanguageChange = (language: string) => {
    if (!language || language === currentLanguage) return; // no-op if same
    // Proactively close any open dropdown/focus before re-render to avoid stuck overlays in WebView
    try {
      (document.activeElement as HTMLElement | null)?.blur?.();
      closeAllOverlays();
      window.scrollTo({ top: 0, behavior: 'auto' });
    } catch { }
    // Defer state update slightly to allow overlays to close fully
    setTimeout(() => {
      setCurrentLanguage(language);
      try { localStorage.setItem('preferred-language', language); } catch { }
      const isRTL = i18nRtl.includes(language);
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
      try {
        // brief feedback toast
        toast({ title: t.ui.languageChanged, description: t.ui.interfaceUpdated });
      } catch { }
    }, 60);
  };

  // Set initial direction and language on component mount
  React.useEffect(() => {
    const isRTL = i18nRtl.includes(currentLanguage);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  // Global guard: close any overlays on scroll to prevent stuck layers in Android WebView
  React.useEffect(() => {
    const onScroll = () => {
      try {
        closeAllOverlays();
      } catch { }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLocationChange = () => {
    // التحقق من دعم المتصفح للموقع الجغرافي
    if (!navigator.geolocation) {
      toast({
        title: t.toast.locationNotSupported || "Location Not Supported",
        description: t.toast.locationNotSupportedDesc || "Your browser doesn't support geolocation",
        variant: "destructive"
      });
      return;
    }

    // التحقق من أن الصفحة تعمل على HTTPS (مطلوب للـ geolocation)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      toast({
        title: "HTTPS Required",
        description: "Location services require a secure connection (HTTPS)",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: t.toast.locatingUser || "Locating...",
      description: t.toast.locatingUserDesc || "Please wait while we determine your location"
    });

    // محاولة الحصول على الموقع مع خيارات محسّنة
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        // حفظ الموقع في State
        setUserLocation({ latitude, longitude });
        
        // حفظ في localStorage للاستخدام لاحقاً
        localStorage.setItem('userLocation', JSON.stringify({ 
          latitude, 
          longitude,
          timestamp: Date.now()
        }));

        // Dispatch custom event for other components to react
        window.dispatchEvent(new CustomEvent('location-updated', { 
          detail: { latitude, longitude } 
        }));
        
        // حفظ في profile إذا كان المستخدم مسجل دخول
        if (user?.uid) {
          // If user is a provider, DO NOT update their profile location from here.
          // They should only update it via Edit Profile settings.
          if (role === 'provider') {
             console.log('ℹ️ User is provider - skipping profile location update (local state only)');
          } else {
            try {
              console.log('🔄 Saving location to profile for user:', user.uid);
              await updateDoc(doc(db, 'profiles', user.uid), {
                latitude,
                longitude,
                location_updated_at: new Date().toISOString()
              });
              console.log('✅ Location saved to profile successfully!', { 
                userId: user.uid,
                latitude, 
                longitude 
              });
            } catch (error) {
              console.error('❌ Error saving location to profile:', error);
            }
          }
        } else {
          console.warn('⚠️ User not logged in - location not saved to profile');
        }
        
        const accuracyText = accuracy < 100 ? "دقيق" : accuracy < 500 ? "جيد" : "تقريبي";
        
        toast({
          title: t.toast.locationSuccess || "Location Found!",
          description: `Latitude: ${latitude.toFixed(6)}\nLongitude: ${longitude.toFixed(6)}\nAccuracy: ${accuracy.toFixed(0)}m (${accuracyText})`,
        });
        
        console.log("Location obtained:", { 
          latitude, 
          longitude, 
          accuracy,
          timestamp: new Date().toISOString()
        });
      },
      (error) => {
        // معالجة مفصلة للأخطاء
        let errorMessage = t.toast.locationFailed || "Failed to get location";
        let errorDescription = "";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = t.toast.locationPermissionDenied || "Permission Denied";
            errorDescription = "Please allow location access in your browser settings";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = t.toast.locationUnavailable || "Location Unavailable";
            errorDescription = "Location information is not available. Please check your GPS/Wi-Fi";
            break;
          case error.TIMEOUT:
            errorMessage = t.toast.locationTimeout || "Request Timeout";
            errorDescription = "Location request timed out. Please try again";
            break;
          default:
            errorDescription = error.message || "Unknown error occurred";
        }
        
        console.error("Geolocation error:", {
          code: error.code,
          message: error.message,
          timestamp: new Date().toISOString()
        });
        
        toast({
          title: errorMessage,
          description: errorDescription,
          variant: "destructive"
        });
        
        // محاولة استخدام الموقع المحفوظ إذا كان متاحاً
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
          try {
            const { latitude, longitude, timestamp } = JSON.parse(savedLocation);
            // استخدام الموقع المحفوظ إذا كان أقل من ساعة
            if (Date.now() - timestamp < 3600000) {
              setUserLocation({ latitude, longitude });
              toast({
                title: "Using Saved Location",
                description: "Using your previously saved location",
              });
            }
          } catch (e) {
            console.error("Error parsing saved location:", e);
          }
        }
      },
      {
        enableHighAccuracy: true, // استخدام GPS عالي الدقة
        timeout: 15000, // زيادة الوقت إلى 15 ثانية
        maximumAge: 300000 // قبول مواقع محفوظة حتى 5 دقائق
      }
    );
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
              {/* Global guard: if user is signed-in but profile is incomplete, send to /complete-profile */}
              <EnsureProfile />
              <div className="flex min-h-screen w-full bg-background">
                <AppSidebar
                  currentLanguage={currentLanguage}
                  onLanguageChange={handleLanguageChange}
                  onLocationChange={handleLocationChange}
                />

                <div className="flex-1 flex flex-col">
                  <Header
                    currentLanguage={currentLanguage}
                    onLanguageChange={handleLanguageChange}
                    onLocationChange={handleLocationChange}
                  />
                  {/* Spacer to offset fixed header height */}
                  <div style={{ height: 'var(--app-header-height, 56px)' }} />

                  <main className="flex-1 relative">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>
                    
                    <div className="relative z-10">
                    <React.Suspense fallback={
                      <div className="flex items-center justify-center min-h-[50vh]">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                      </div>
                    }>
                    <Routes>
                      <Route path="/" element={
                        <Index
                          currentLanguage={currentLanguage}
                          onLanguageChange={handleLanguageChange}
                          onLocationChange={handleLocationChange}
                        />
                      } />
                      <Route path="/auth" element={<Auth currentLanguage={currentLanguage} onLanguageChange={handleLanguageChange} />} />
                      <Route path="/reset-password" element={<ResetPassword currentLanguage={currentLanguage} />} />
                      <Route path="/provider-signup" element={<ProviderSignup currentLanguage={currentLanguage} onLanguageChange={handleLanguageChange} />} />
                      <Route path="/customer-signup" element={<CustomerSignup currentLanguage={currentLanguage} onLanguageChange={handleLanguageChange} />} />
                      <Route path="/services" element={<Services currentLanguage={currentLanguage} />} />
                      <Route path="/favorites" element={
                        <ProtectedRoute requireRole="customer">
                          <Favorites currentLanguage={currentLanguage} />
                        </ProtectedRoute>
                      } />
                      <Route path="/provider-dashboard" element={
                        <ProtectedRoute requireRole="provider">
                          <ProviderDashboard currentLanguage={currentLanguage} />
                        </ProtectedRoute>
                      } />
                      <Route path="/customer-dashboard" element={
                        <ProtectedRoute requireRole="customer">
                          <CustomerDashboard currentLanguage={currentLanguage} />
                        </ProtectedRoute>
                      } />
                      <Route path="/add-service" element={<AddService currentLanguage={currentLanguage} />} />
                      <Route path="/edit-service/:serviceId" element={<EditService currentLanguage={currentLanguage} />} />
                      <Route path="/edit-profile" element={<EditProfile currentLanguage={currentLanguage} />} />
                      <Route path="/timezone" element={<TimezoneSettings currentLanguage={currentLanguage} />} />
                      <Route path="/provider/:providerId" element={<ProviderProfile currentLanguage={currentLanguage} onLanguageChange={handleLanguageChange} />} />
                      <Route path="/console" element={<AdminConsole currentLanguage={currentLanguage} />} />
                      <Route path="/terms" element={<Terms currentLanguage={currentLanguage} />} />
                      <Route path="/privacy" element={<Privacy currentLanguage={currentLanguage} />} />
                      <Route path="/disclaimer" element={<Disclaimer currentLanguage={currentLanguage} />} />
                      <Route path="/content-policy" element={<ContentPolicy currentLanguage={currentLanguage} />} />
                      <Route path="/select-role" element={<RoleSelection currentLanguage={currentLanguage} />} />
                      <Route path="/complete-profile" element={<CompleteProfile currentLanguage={currentLanguage} />} />
                      <Route path="/about" element={<AboutUs currentLanguage={currentLanguage} />} />
                      <Route path="/contact" element={<ContactUs currentLanguage={currentLanguage} />} />
                      <Route path="/user-guide" element={<UserGuide currentLanguage={currentLanguage} />} />
                      <Route path="/debug/notifications" element={<DebugNotifications />} />
                      <Route path="/notifications" element={<NotificationsHistory />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound currentLanguage={currentLanguage} />} />
                    </Routes>
                    </React.Suspense>
                    </div>
                  </main>
                </div>
              </div>
            </SidebarProvider>
            
            {/* Sticky Footer Ad (Floating Card Style) - Shows on ALL devices */}
            <AdBanner type="sticky-footer" slotId="1234567890" />
            
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationLogProvider>
          <AppContent />
        </NotificationLogProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
