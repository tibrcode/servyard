import React from "react";
import { Button } from "@/components/ui/button";
import { Search, Map, LogIn, LayoutDashboard, MapPin } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/contexts/AuthContext";

interface MainActionsProps {
  currentLanguage?: string;
  onLocationClick?: () => void;
}

export const MainActions = ({ 
  currentLanguage = 'en',
  onLocationClick 
}: MainActionsProps) => {
  const { t, isRTL } = useTranslation(currentLanguage);
  const { user, role, loading } = useAuth();

  const handleServicesClick = () => {
    window.location.href = '/services';
  };

  const handleMapClick = () => {
    // Open services page in map view mode
    window.location.href = '/services?view=map';
  };

  const handleAuthClick = () => {
    // Always go to login/auth page
    window.location.href = '/auth';
  };

  const handleDashboardClick = () => {
    // If still loading auth state, wait
    if (loading) {
      return;
    }

    if (!user) {
      window.location.href = '/auth';
      return;
    }

    if (role === 'provider') {
      window.location.href = '/provider-dashboard';
    } else if (role === 'customer') {
      window.location.href = '/customer-dashboard';
    } else {
      // If role is not set yet, go to customer dashboard as default
      window.location.href = '/customer-dashboard';
    }
  };

  return (
    <section 
      className="relative py-12 md:py-16"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Content */}
          <div className="animate-luxury-fade mb-8">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent whitespace-pre-line">
              {t.home.title}
            </h1>
          </div>

          {/* Action Buttons Grid */}
          <div className="animate-luxury-scale">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto">
              {/* Button 1: Services */}
              <Button
                onClick={handleServicesClick}
                className="aspect-square font-bold border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 rounded-2xl flex flex-col items-center justify-center p-6 md:p-8"
                style={{
                  boxShadow: '0 4px 15px rgba(34, 197, 94, 0.2)'
                }}
              >
                <Search style={{ width: '80px', height: '80px' }} className="mb-3" />
                <span className="text-center leading-tight" style={{ fontSize: '1.5rem' }}>{t.home.findServices}</span>
              </Button>

              {/* Button 2: Map Services */}
              <Button
                onClick={handleMapClick}
                className="aspect-square font-bold border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 rounded-2xl flex flex-col items-center justify-center p-6 md:p-8"
                style={{
                  boxShadow: '0 4px 15px rgba(34, 197, 94, 0.2)'
                }}
              >
                <Map style={{ width: '80px', height: '80px' }} className="mb-3" />
                <span className="text-center leading-tight" style={{ fontSize: '1.5rem' }}>{t.home.servicesOnMap || (isRTL ? 'الخدمات عبر الخريطة' : 'Services on Map')}</span>
              </Button>

              {/* Button 3: Login */}
              <Button
                onClick={handleAuthClick}
                className="aspect-square font-bold border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 rounded-2xl flex flex-col items-center justify-center p-6 md:p-8"
                style={{
                  boxShadow: '0 4px 15px rgba(34, 197, 94, 0.2)'
                }}
              >
                <LogIn style={{ width: '80px', height: '80px' }} className="mb-3" />
                <span className="text-center leading-tight" style={{ fontSize: '1.5rem' }}>{t.home.login || (isRTL ? 'تسجيل الدخول' : 'Login')}</span>
              </Button>

              {/* Button 4: Dashboard */}
              <Button
                onClick={handleDashboardClick}
                disabled={loading}
                className="aspect-square font-bold border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 rounded-2xl flex flex-col items-center justify-center p-6 md:p-8 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  boxShadow: '0 4px 15px rgba(34, 197, 94, 0.2)'
                }}
              >
                <LayoutDashboard style={{ width: '80px', height: '80px' }} className="mb-3" />
                <span className="text-center leading-tight" style={{ fontSize: '1.5rem' }}>{t.home.dashboard || (isRTL ? 'لوحة التحكم' : 'Dashboard')}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
