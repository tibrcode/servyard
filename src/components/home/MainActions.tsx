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
            <h1 
              className="text-5xl md:text-7xl lg:text-8xl font-display font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent"
              style={{ textShadow: '0 4px 20px rgba(34, 197, 94, 0.3), 0 2px 8px rgba(34, 197, 94, 0.2)' }}
            >
              ServYard
            </h1>
            <p 
              className="text-xl md:text-2xl lg:text-3xl mt-2 font-display font-semibold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent"
              style={{ textShadow: '0 2px 12px rgba(34, 197, 94, 0.25), 0 1px 4px rgba(34, 197, 94, 0.15)' }}
            >
              {isRTL ? 'منصة الخدمات المتميزة' : 'Premium Service Marketplace'}
            </p>
          </div>

          {/* Action Buttons Grid */}
          <div className="animate-luxury-scale">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto">
              {/* Button 1: Services */}
              <Button
                variant="ghost"
                onClick={handleServicesClick}
                className="homepage-button aspect-square font-medium transition-all duration-300 flex flex-col items-center justify-center p-6 md:p-8 hover:bg-transparent"
                style={{
                  background: 'linear-gradient(145deg, rgba(28, 28, 30, 0.8), rgba(10, 10, 12, 0.9))',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
                  transform: 'perspective(1000px) rotateX(2deg) rotateY(0deg)',
                  transformStyle: 'preserve-3d'
                }}
              >
                <Search className="mb-2 text-blue-400" style={{ width: '48px', height: '48px' }} />
                <span className="text-center leading-tight text-white text-base">{t.home.findServices}</span>
              </Button>

              {/* Button 2: Map Services */}
              <Button
                variant="ghost"
                onClick={handleMapClick}
                className="homepage-button aspect-square font-medium transition-all duration-300 flex flex-col items-center justify-center p-6 md:p-8 hover:bg-transparent"
                style={{
                  background: 'linear-gradient(145deg, rgba(28, 28, 30, 0.8), rgba(10, 10, 12, 0.9))',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
                  transform: 'perspective(1000px) rotateX(2deg) rotateY(0deg)',
                  transformStyle: 'preserve-3d'
                }}
              >
                <Map className="mb-2 text-orange-400" style={{ width: '48px', height: '48px' }} />
                <span className="text-center leading-tight text-white text-base">{t.home.servicesOnMap || (isRTL ? 'الخدمات عبر الخريطة' : 'Services on Map')}</span>
              </Button>

              {/* Button 3: Login */}
              <Button
                variant="ghost"
                onClick={handleAuthClick}
                className="homepage-button aspect-square font-medium transition-all duration-300 flex flex-col items-center justify-center p-6 md:p-8 hover:bg-transparent"
                style={{
                  background: 'linear-gradient(145deg, rgba(28, 28, 30, 0.8), rgba(10, 10, 12, 0.9))',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
                  transform: 'perspective(1000px) rotateX(2deg) rotateY(0deg)',
                  transformStyle: 'preserve-3d'
                }}
              >
                <LogIn className="mb-2 text-purple-400" style={{ width: '48px', height: '48px' }} />
                <span className="text-center leading-tight text-white text-base">{t.home.login || (isRTL ? 'تسجيل الدخول' : 'Login')}</span>
              </Button>

              {/* Button 4: Dashboard */}
              <Button
                variant="ghost"
                onClick={handleDashboardClick}
                disabled={loading}
                className="homepage-button aspect-square font-medium transition-all duration-300 flex flex-col items-center justify-center p-6 md:p-8 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-transparent"
                style={{
                  background: 'linear-gradient(145deg, rgba(28, 28, 30, 0.8), rgba(10, 10, 12, 0.9))',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
                  transform: 'perspective(1000px) rotateX(2deg) rotateY(0deg)',
                  transformStyle: 'preserve-3d'
                }}
              >
                <LayoutDashboard className="mb-2 text-green-400" style={{ width: '48px', height: '48px' }} />
                <span className="text-center leading-tight text-white text-base">{t.home.dashboard || (isRTL ? 'لوحة التحكم' : 'Dashboard')}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
