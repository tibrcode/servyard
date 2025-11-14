import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import { Mail, Globe, MapPin } from "lucide-react";

interface ContactUsProps {
  currentLanguage: string;
}

const ContactUs = ({ currentLanguage }: ContactUsProps) => {
  const { t, isRTL } = useTranslation(currentLanguage);

  return (
    <div className="min-h-screen flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center">
                {t.legal.contactUs.title}
              </CardTitle>
              <p className="text-center text-muted-foreground">
                For inquiries, complaints, or support
              </p>
            </CardHeader>
            <CardContent className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
              <div className="grid md:grid-cols-1 gap-6">
                <div className="space-y-6">
                  <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    <Globe className="h-6 w-6 text-primary" />
                    <div>
                      <h3 className="text-lg font-medium">{t.legal.contactUs.website}</h3>
                      <p className="text-muted-foreground">www.servyard.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    <Mail className="h-6 w-6 text-primary" />
                    <div>
                      <h3 className="text-lg font-medium">{t.legal.contactUs.email}</h3>
                      <p className="text-muted-foreground">support@servyard.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    <MapPin className="h-6 w-6 text-primary" />
                    <div>
                      <h3 className="text-lg font-medium">{t.legal.contactUs.address}</h3>
                      <p className="text-muted-foreground">22218 Abu Dhabi - UAE</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 mt-8">
                <p className="text-sm text-muted-foreground text-center">
                  We strive to respond to all inquiries within 24-48 hours.
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

export default ContactUs;