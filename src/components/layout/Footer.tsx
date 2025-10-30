import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "@/lib/i18n";

interface FooterProps {
  currentLanguage?: string;
}

export const Footer = ({ currentLanguage = 'en' }: FooterProps) => {
  const { t, isRTL } = useTranslation(currentLanguage);

  const footerLinks = [
    { label: t.footer.links.terms, href: "/terms" },
    { label: t.footer.links.privacy, href: "/privacy" },
    { label: t.footer.links.disclaimer, href: "/disclaimer" },
    { label: t.footer.links.contentPolicy, href: "/content-policy" },
    { label: t.footer.links.aboutUs, href: "/about" },
    { label: t.footer.links.contactUs, href: "/contact" },
  ];

  return (
    <footer
      className="bg-muted border-t mt-auto"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center space-y-6">
          {/* Logo and Tagline */}
          <div className="text-center">
            <h3 className="text-xl font-display font-bold text-primary mb-2">
              ServYard
            </h3>
            <p className="text-muted-foreground text-sm max-w-md">
              {t.footer.tagline}
            </p>
          </div>

          {/* Footer Links */}
          <div className={`flex flex-wrap justify-center gap-4 md:gap-8 ${isRTL ? 'space-x-reverse' : ''}`}>
            {footerLinks.map((link, index) => (
              <Link
                key={index}
                to={link.href}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Copyright */}
          <div className="text-center pt-6 border-t border-border w-full">
            <p className="text-xs text-muted-foreground">
              {t.footer.copyright}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t.footer.paymentDisclaimer}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};