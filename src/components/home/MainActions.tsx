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
  const { user, role } = useAuth();

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
    if (!user) {
      window.location.href = '/auth';
      return;
    }

    if (role === 'provider') {
      window.location.href = '/provider/dashboard';
    } else if (role === 'customer') {
      window.location.href = '/customer/dashboard';
    } else {
      window.location.href = '/customer/dashboard'; // default
    }
  };

  return (
    <section 
      className="relative py-20 md:py-32"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Content */}
          <div className="animate-luxury-fade mb-12">
            <div className="flex justify-center items-center mb-6">
              <MapPin className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-6 bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
              {t.home.title}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              {t.home.subtitle}
            </p>
          </div>

          {/* Action Buttons Grid */}
          <div className="animate-luxury-scale">
            <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
              {/* Button 1: Services */}
              <Button
                onClick={handleServicesClick}
                className="aspect-square text-lg md:text-xl font-semibold border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 rounded-2xl flex flex-col items-center justify-center gap-3 p-4"
                style={{
                  boxShadow: '0 4px 15px rgba(var(--primary-rgb, 217, 165, 82), 0.2)'
                }}
              >
                <Search className="h-8 w-8 md:h-10 md:w-10" />
                <span className="text-center leading-tight">{t.home.findServices}</span>
              </Button>

              {/* Button 2: Map Services */}
              <Button
                onClick={handleMapClick}
                className="aspect-square text-lg md:text-xl font-semibold border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 rounded-2xl flex flex-col items-center justify-center gap-3 p-4"
                style={{
                  boxShadow: '0 4px 15px rgba(var(--primary-rgb, 217, 165, 82), 0.2)'
                }}
              >
                <Map className="h-8 w-8 md:h-10 md:w-10" />
                <span className="text-center leading-tight">{t.home.servicesOnMap || (isRTL ? 'الخدمات عبر الخريطة' : 'Services on Map')}</span>
              </Button>

              {/* Button 3: Login */}
              <Button
                onClick={handleAuthClick}
                className="aspect-square text-lg md:text-xl font-semibold border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 rounded-2xl flex flex-col items-center justify-center gap-3 p-4"
                style={{
                  boxShadow: '0 4px 15px rgba(var(--primary-rgb, 217, 165, 82), 0.2)'
                }}
              >
                <LogIn className="h-8 w-8 md:h-10 md:w-10" />
                <span className="text-center leading-tight">{t.home.login || (isRTL ? 'تسجيل الدخول' : 'Login')}</span>
              </Button>

              {/* Button 4: Dashboard */}
              <Button
                onClick={handleDashboardClick}
                className="aspect-square text-lg md:text-xl font-semibold border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 rounded-2xl flex flex-col items-center justify-center gap-3 p-4"
                style={{
                  boxShadow: '0 4px 15px rgba(var(--primary-rgb, 217, 165, 82), 0.2)'
                }}
              >
                <LayoutDashboard className="h-8 w-8 md:h-10 md:w-10" />
                <span className="text-center leading-tight">{t.home.dashboard || (isRTL ? 'لوحة التحكم' : 'Dashboard')}</span>
              </Button>
            </div>

            {/* Location Button */}
            {onLocationClick && (
              <div className="mt-8">
                <Button
                  variant="ghost"
                  onClick={onLocationClick}
                  className="text-muted-foreground hover:text-primary"
                >
                  <MapPin className="h-5 w-5 mr-2" />
                  <span>{t.nav.location}</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
