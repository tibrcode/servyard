import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";

interface ContentPolicyProps {
  currentLanguage: string;
}

const ContentPolicy = ({ currentLanguage }: ContentPolicyProps) => {
  const { t, isRTL } = useTranslation(currentLanguage);

  return (
    <div className="min-h-screen flex flex-col bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center">
                {t.legal.contentPolicy.title}
              </CardTitle>
              <p className="text-center text-muted-foreground">
                {t.legal.contentPolicy.lastUpdated} {new Date().toLocaleDateString()}
              </p>
            </CardHeader>
            <CardContent className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
              <section>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {t.legal.contentPolicy.acceptable.content}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">{t.legal.contentPolicy.prohibited.title}</h2>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  {t.legal.contentPolicy.prohibited.points.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">{t.legal.contentPolicy.moderation.title}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t.legal.contentPolicy.moderation.points.join(' ')}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">{t.legal.contentPolicy.reporting.title}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t.legal.contentPolicy.reporting.content}
                </p>
              </section>

              <div className="border-t pt-6 mt-8">
                <p className="text-sm text-muted-foreground text-center">
                  {t.legal.contentPolicy.acknowledgment}
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

export default ContentPolicy;