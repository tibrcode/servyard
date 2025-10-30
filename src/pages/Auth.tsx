import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, UserPlus } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Footer } from "@/components/layout/Footer";
import { LoginForm } from "@/components/auth/LoginForm";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface AuthProps {
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
}

export default function Auth({ currentLanguage, onLanguageChange }: AuthProps) {
  const { t, isRTL } = useTranslation(currentLanguage);
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (user) {
      if (role === 'provider') navigate('/provider-dashboard', { replace: true });
      else if (role === 'customer') navigate('/customer-dashboard', { replace: true });
      // If role is unknown, stay on /auth and let the LoginForm/profile flow resolve
    }
  }, [user, role, loading, navigate]);


  return (
    <div className="min-h-screen flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <main className="flex-1 py-12 px-4">
        <div className="container mx-auto max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-primary mb-2">
              {t.auth.welcome}
            </h1>
            <p className="text-muted-foreground text-lg">
              {t.auth.subtitle}
            </p>
          </div>

          {/* Login Form */}
          <LoginForm currentLanguage={currentLanguage} />

          {/* Signup Links */}
          <div className="text-center mt-8 space-y-4">
            <p className="text-muted-foreground">
              {t.auth.signup}?
            </p>
            
            <div className="grid grid-cols-1 gap-4">
              <Link to="/provider-signup">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-2">
                      <UserPlus className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{t.auth.joinAsProvider}</CardTitle>
                    <CardDescription>{t.auth.providerDescription}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link to="/customer-signup">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-2">
                      <User className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{t.auth.joinAsCustomer}</CardTitle>
                    <CardDescription>{t.auth.customerDescription}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer currentLanguage={currentLanguage} />
    </div>
  );
}