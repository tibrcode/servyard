import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Footer } from "@/components/layout/Footer";
import { ProviderSignup as ProviderSignupForm } from "@/components/auth/ProviderSignup";
import { Link } from "react-router-dom";

interface ProviderSignupProps {
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
}

export default function ProviderSignup({ currentLanguage, onLanguageChange }: ProviderSignupProps) {
  const { t, isRTL } = useTranslation(currentLanguage);

  return (
    <div className="min-h-screen flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <main className="flex-1 py-12 px-4">
        <div className="container mx-auto max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center">
                <Building2 className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-primary mb-2">
              {t.auth.welcome}
            </h1>
            <p className="text-muted-foreground text-lg">
              {t.auth.providerDescription}
            </p>
          </div>

          {/* Provider Signup Form */}
          <ProviderSignupForm currentLanguage={currentLanguage} />

          {/* Links */}
          <div className="text-center mt-6 space-y-2">
            <p className="text-muted-foreground">
              {t.auth.customerDescription}
            </p>
            <div className="space-x-4">
              <Button variant="outline" asChild>
                <Link to="/customer-signup">{t.auth.joinAsCustomer}</Link>
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