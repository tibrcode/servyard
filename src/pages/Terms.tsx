import { useState } from "react";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";

interface TermsProps {
  currentLanguage: string;
}

const Terms = ({ currentLanguage }: TermsProps) => {
  const { t, isRTL } = useTranslation(currentLanguage);

  return (
    <div className="min-h-screen flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center">
                {t.legal.terms.title}
              </CardTitle>
              <p className="text-center text-muted-foreground">
                {t.legal.terms.lastUpdated}: {new Date().toLocaleDateString()}
              </p>
            </CardHeader>
            <CardContent className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
              <section>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {t.legal.terms.intro}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">{t.legal.terms.purpose.title}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t.legal.terms.purpose.content}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">{t.legal.terms.userAccounts.title}</h2>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  {t.legal.terms.userAccounts.points.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">{t.legal.terms.serviceListings.title}</h2>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  {t.legal.terms.serviceListings.points.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">{t.legal.terms.payments.title}</h2>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  {t.legal.terms.payments.points.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">{t.legal.terms.location.title}</h2>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  {t.legal.terms.location.points.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">{t.legal.terms.intellectualProperty.title}</h2>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  {t.legal.terms.intellectualProperty.points.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">{t.legal.terms.liability.title}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t.legal.terms.liability.content}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">{t.legal.terms.governingLaw.title}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t.legal.terms.governingLaw.content}
                </p>
              </section>

              <div className="border-t pt-6 mt-8">
                <p className="text-sm text-muted-foreground text-center">
                  {t.legal.terms.acknowledgment}
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

export default Terms;