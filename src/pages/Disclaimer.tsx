import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";

interface DisclaimerProps {
  currentLanguage: string;
}

const Disclaimer = ({ currentLanguage }: DisclaimerProps) => {
  const { t, isRTL } = useTranslation(currentLanguage);

  return (
    <div className="min-h-screen flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center">
                {t.legal.disclaimer.title}
              </CardTitle>
              <p className="text-center text-muted-foreground">
                {t.legal.disclaimer.lastUpdated} {new Date().toLocaleDateString()}
              </p>
            </CardHeader>
            <CardContent className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
              <section>
                <p className="text-muted-foreground leading-relaxed text-lg font-medium">
                  {t.legal.disclaimer.intro}
                </p>
              </section>

              <section>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground ml-4">
                  {t.legal.disclaimer.points.map((point: string, index: number) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </section>

              <div className="border-t pt-6 mt-8">
                <p className="text-sm text-muted-foreground text-center">
                  {t.legal.disclaimer.acknowledgment}
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

export default Disclaimer;