import { useState } from "react";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";

interface PrivacyProps {
  currentLanguage: string;
}

const Privacy = ({ currentLanguage }: PrivacyProps) => {
  const { t, isRTL } = useTranslation(currentLanguage);

  return (
    <div className="min-h-screen flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center">
                {t.legal.privacy.title}
              </CardTitle>
              <p className="text-center text-muted-foreground">
                {t.legal.privacy.lastUpdated} {new Date().toLocaleDateString()}
              </p>
            </CardHeader>
            <CardContent className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
              <section>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {t.legal.privacy.intro}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">1. {t.legal.privacy.dataCollection.title}</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">{t.legal.privacy.dataCollection.clients.title}</h3>
                    <p className="text-muted-foreground">{t.legal.privacy.dataCollection.clients.content}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">{t.legal.privacy.dataCollection.providers.title}</h3>
                    <p className="text-muted-foreground">{t.legal.privacy.dataCollection.providers.content}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">{t.legal.privacy.dataCollection.general.title}</h3>
                    <p className="text-muted-foreground">{t.legal.privacy.dataCollection.general.content}</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. {t.legal.privacy.purpose.title}</h2>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  {t.legal.privacy.purpose.points.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. {t.legal.privacy.dataSharing.title}</h2>
                <div className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    {t.legal.privacy.dataSharing.intro}
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    {t.legal.privacy.dataSharing.points.map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. {t.legal.privacy.compliance.title}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t.legal.privacy.compliance.content}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. {t.legal.privacy.security.title}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t.legal.privacy.security.content}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. {t.legal.privacy.userRights.title}</h2>
                <div className="space-y-2">
                  <p className="text-muted-foreground">{t.legal.privacy.userRights.intro}:</p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    {t.legal.privacy.userRights.points.map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                  <p className="text-muted-foreground mt-4">{t.legal.privacy.userRights.contact}</p>
                </div>
              </section>

              <div className="border-t pt-6 mt-8">
                <p className="text-sm text-muted-foreground text-center">
                  {t.legal.privacy.acknowledgment}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer currentLanguage={currentLanguage} />
    </div>
  );
};

export default Privacy;