import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Building2, ShoppingBag, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface RoleSelectionProps {
  currentLanguage: string;
}

export default function RoleSelection({ currentLanguage }: RoleSelectionProps) {
  const { t, isRTL } = useTranslation(currentLanguage);
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'customer' | 'provider' | null>(null);
  const [isHovering, setIsHovering] = useState<'customer' | 'provider' | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [loading, user, navigate]);

  // Redirect if user already has a role
  useEffect(() => {
    if (!loading && user && profile?.user_type && profile.user_type !== 'unknown') {
      if (profile.user_type === 'provider') {
        navigate('/provider-dashboard', { replace: true });
      } else if (profile.user_type === 'customer') {
        navigate('/customer-dashboard', { replace: true });
      }
    }
  }, [loading, user, profile, navigate]);

  const handleRoleSelect = (role: 'customer' | 'provider') => {
    setSelectedRole(role);
    // Navigate to complete profile with the selected role
    navigate(`/complete-profile?role=${role}`, { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted" dir={isRTL ? 'rtl' : 'ltr'}>
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  // Translations with fallbacks
  const roleSelectionT = {
    title: (t as any).roleSelection?.title || (isRTL ? 'مرحباً بك في ServYard' : 'Welcome to ServYard'),
    subtitle: (t as any).roleSelection?.subtitle || (isRTL ? 'اختر نوع حسابك للبدء' : 'Choose your account type to get started'),
    customerDesc: (t as any).roleSelection?.customerDesc || t.auth.customerDescription,
    providerDesc: (t as any).roleSelection?.providerDesc || t.auth.providerDescription,
    customerBenefit1: (t as any).roleSelection?.customerBenefit1 || (isRTL ? 'ابحث عن أفضل مزودي الخدمات' : 'Find the best service providers'),
    customerBenefit2: (t as any).roleSelection?.customerBenefit2 || (isRTL ? 'احجز المواعيد بسهولة' : 'Book appointments easily'),
    customerBenefit3: (t as any).roleSelection?.customerBenefit3 || (isRTL ? 'تابع حجوزاتك ومفضلاتك' : 'Track your bookings and favorites'),
    providerBenefit1: (t as any).roleSelection?.providerBenefit1 || (isRTL ? 'اعرض خدماتك للعملاء' : 'Showcase your services to customers'),
    providerBenefit2: (t as any).roleSelection?.providerBenefit2 || (isRTL ? 'أدر حجوزاتك بكفاءة' : 'Manage your bookings efficiently'),
    providerBenefit3: (t as any).roleSelection?.providerBenefit3 || (isRTL ? 'نمّي عملك واكسب المزيد' : 'Grow your business and earn more'),
    continueAsCustomer: (t as any).roleSelection?.continueAsCustomer || (isRTL ? 'المتابعة كعميل' : 'Continue as Customer'),
    continueAsProvider: (t as any).roleSelection?.continueAsProvider || (isRTL ? 'المتابعة كمزود خدمة' : 'Continue as Provider'),
    note: (t as any).roleSelection?.note || (isRTL ? 'يمكنك تغيير نوع حسابك لاحقاً من الإعدادات' : 'You can change your account type later from settings'),
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/30" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-primary/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
              <UserPlus className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {roleSelectionT.title}
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            {roleSelectionT.subtitle}
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Customer Card */}
          <div className="animate-in fade-in slide-in-from-left-4 duration-500 delay-100">
            <Card 
              className={`relative cursor-pointer transition-all duration-300 hover:shadow-xl border-2 overflow-hidden group ${
                selectedRole === 'customer' || isHovering === 'customer' 
                  ? 'border-primary shadow-lg shadow-primary/10' 
                  : 'border-transparent hover:border-primary/50'
              }`}
              onClick={() => handleRoleSelect('customer')}
              onMouseEnter={() => setIsHovering('customer')}
              onMouseLeave={() => setIsHovering(null)}
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <CardHeader className="relative text-center pb-4 pt-8">
                <div className="flex justify-center mb-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isHovering === 'customer' 
                      ? 'bg-primary text-white scale-110' 
                      : 'bg-primary/10 text-primary'
                  }`}>
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                </div>
                <CardTitle className="text-2xl mb-2">{t.auth.joinAsCustomer}</CardTitle>
                <CardDescription className="text-base">
                  {roleSelectionT.customerDesc}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="relative pb-8">
                <ul className="space-y-3 text-sm text-muted-foreground mb-6">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {roleSelectionT.customerBenefit1}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {roleSelectionT.customerBenefit2}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {roleSelectionT.customerBenefit3}
                  </li>
                </ul>
                
                <Button 
                  className="w-full luxury-button group/btn"
                  size="lg"
                >
                  {roleSelectionT.continueAsCustomer}
                  <ArrowIcon className="w-4 h-4 transition-transform group-hover/btn:translate-x-1 rtl:group-hover/btn:-translate-x-1" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Provider Card */}
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 delay-200">
            <Card 
              className={`relative cursor-pointer transition-all duration-300 hover:shadow-xl border-2 overflow-hidden group ${
                selectedRole === 'provider' || isHovering === 'provider' 
                  ? 'border-primary shadow-lg shadow-primary/10' 
                  : 'border-transparent hover:border-primary/50'
              }`}
              onClick={() => handleRoleSelect('provider')}
              onMouseEnter={() => setIsHovering('provider')}
              onMouseLeave={() => setIsHovering(null)}
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <CardHeader className="relative text-center pb-4 pt-8">
                <div className="flex justify-center mb-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isHovering === 'provider' 
                      ? 'bg-primary text-white scale-110' 
                      : 'bg-primary/10 text-primary'
                  }`}>
                    <Building2 className="w-8 h-8" />
                  </div>
                </div>
                <CardTitle className="text-2xl mb-2">{t.auth.joinAsProvider}</CardTitle>
                <CardDescription className="text-base">
                  {roleSelectionT.providerDesc}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="relative pb-8">
                <ul className="space-y-3 text-sm text-muted-foreground mb-6">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {roleSelectionT.providerBenefit1}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {roleSelectionT.providerBenefit2}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {roleSelectionT.providerBenefit3}
                  </li>
                </ul>
                
                <Button 
                  className="w-full luxury-button group/btn"
                  size="lg"
                >
                  {roleSelectionT.continueAsProvider}
                  <ArrowIcon className="w-4 h-4 transition-transform group-hover/btn:translate-x-1 rtl:group-hover/btn:-translate-x-1" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-muted-foreground animate-in fade-in duration-500 delay-300">
          {roleSelectionT.note}
        </p>
      </div>
    </div>
  );
}
