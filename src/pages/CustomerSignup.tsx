import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Footer } from "@/components/layout/Footer";
import { CustomerSignup as CustomerSignupForm } from "@/components/auth/CustomerSignup";
import { Link } from "react-router-dom";

interface CustomerSignupProps {
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
}

export default function CustomerSignup({ currentLanguage, onLanguageChange }: CustomerSignupProps) {
  const { t, isRTL } = useTranslation(currentLanguage);

  return (
    <div className="min-h-screen flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <main className="flex-1 py-12 px-4">
        <div className="container mx-auto max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-primary mb-2">
              {t.auth.welcome}
            </h1>
            <p className="text-muted-foreground text-lg">
              {t.auth.customerDescription}
            </p>
          </div>

          {/* Customer Signup Form */}
          <CustomerSignupForm currentLanguage={currentLanguage} />

          {/* Links */}
          <div className="text-center mt-6 space-y-2">
            <p className="text-muted-foreground">
              {t.auth.providerDescription}
            </p>
            <div className="space-x-4">
              <Button variant="outline" asChild>
                <Link to="/provider-signup">{t.auth.joinAsProvider}</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/auth">{t.auth.login}</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer currentLanguage={currentLanguage} />
    </div>
  );
}