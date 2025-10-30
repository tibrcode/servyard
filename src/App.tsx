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
import { Header } from "@/components/layout/Header";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import ProviderSignup from "@/pages/ProviderSignup";
import CustomerSignup from "@/pages/CustomerSignup";
import Services from "@/pages/Services";
import ProviderDashboard from "@/pages/ProviderDashboard";
import CustomerDashboard from "@/pages/CustomerDashboard";
import AddService from "@/pages/AddService";
import EditService from "@/pages/EditService";
import EditProfile from "@/pages/EditProfile";
import ProviderProfile from "@/pages/ProviderProfile";
import AdminConsole from "@/pages/AdminConsole";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Disclaimer from "@/pages/Disclaimer";
import ContentPolicy from "@/pages/ContentPolicy";
import AboutUs from "@/pages/AboutUs";
import ContactUs from "@/pages/ContactUs";
import NotFound from "@/pages/NotFound";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => {
  const [currentLanguage, setCurrentLanguage] = React.useState(() => {
    // Get saved language from localStorage or default to English on first run
    const savedLanguage = localStorage.getItem('preferred-language');
    return savedLanguage || 'en';
  });
  const { t } = useTranslation(currentLanguage);
  const { toast } = useToast();

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
    if (!navigator.geolocation) {
      toast({
        title: t.toast.locationNotSupported,
        description: t.toast.locationNotSupportedDesc,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: t.toast.locatingUser,
      description: t.toast.locatingUserDesc
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        toast({
          title: t.toast.locationSuccess,
          description: `خط العرض: ${latitude.toFixed(6)}\nخط الطول: ${longitude.toFixed(6)}`,
        });
        console.log("Location obtained:", { latitude, longitude });
      },
      (error) => {
        let errorMessage = t.toast.locationFailed;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = t.toast.locationPermissionDenied;
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = t.toast.locationUnavailable;
            break;
          case error.TIMEOUT:
            errorMessage = t.toast.locationTimeout;
            break;
        }
        toast({
          title: t.toast.locationFailed,
          description: errorMessage,
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <SidebarProvider>
              <div className="flex min-h-screen w-full">
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

                  <main className="flex-1">
                    <Routes>
                      <Route path="/" element={
                        <Index
                          currentLanguage={currentLanguage}
                          onLanguageChange={handleLanguageChange}
                          onLocationChange={handleLocationChange}
                        />
                      } />
                      <Route path="/auth" element={<Auth currentLanguage={currentLanguage} onLanguageChange={handleLanguageChange} />} />
                      <Route path="/provider-signup" element={<ProviderSignup currentLanguage={currentLanguage} onLanguageChange={handleLanguageChange} />} />
                      <Route path="/customer-signup" element={<CustomerSignup currentLanguage={currentLanguage} onLanguageChange={handleLanguageChange} />} />
                      <Route path="/services" element={<Services currentLanguage={currentLanguage} />} />
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
                      <Route path="/provider/:providerId" element={<ProviderProfile currentLanguage={currentLanguage} onLanguageChange={handleLanguageChange} />} />
                      <Route path="/console" element={<AdminConsole currentLanguage={currentLanguage} />} />
                      <Route path="/terms" element={<Terms currentLanguage={currentLanguage} />} />
                      <Route path="/privacy" element={<Privacy currentLanguage={currentLanguage} />} />
                      <Route path="/disclaimer" element={<Disclaimer currentLanguage={currentLanguage} />} />
                      <Route path="/content-policy" element={<ContentPolicy currentLanguage={currentLanguage} />} />
                      <Route path="/about" element={<AboutUs currentLanguage={currentLanguage} />} />
                      <Route path="/contact" element={<ContactUs currentLanguage={currentLanguage} />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound currentLanguage={currentLanguage} />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </SidebarProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
