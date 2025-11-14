import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

interface NotFoundProps {
  currentLanguage: string;
}

const NotFound = ({ currentLanguage = 'en' }: NotFoundProps) => {
  const { t, isRTL } = useTranslation(currentLanguage);
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">{t.ui.pageNotFound || 'Page not found'}</p>
        <Button asChild>
          <a href="/">{t.ui.goHome || t.nav.home}</a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
