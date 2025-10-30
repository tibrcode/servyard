import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";

interface AboutUsProps {
  currentLanguage: string;
}

const AboutUs = ({ currentLanguage }: AboutUsProps) => {
  const { t, isRTL } = useTranslation(currentLanguage);

  return (
    <div className="min-h-screen flex flex-col bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center">
                {t.legal.aboutUs.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
              <section className="text-center">
                {t.legal.aboutUs.content.map((paragraph, index) => (
                  <p key={index} className="text-muted-foreground leading-relaxed text-lg mt-4 first:mt-0">
                    {paragraph}
                  </p>
                ))}
              </section>

              <div className="border-t pt-6 mt-8">
                <p className="text-sm text-muted-foreground text-center">
                  ServYard - Connecting Communities Through Services
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

export default AboutUs;