import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface SearchHeroProps {
  currentLanguage?: string;
  onSearch?: (query: string) => void;
  onLocationClick?: () => void;
}

export const SearchHero = ({ 
  currentLanguage = 'en',
  onSearch,
  onLocationClick 
}: SearchHeroProps) => {
  const { t, isRTL } = useTranslation(currentLanguage);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearch?.(searchQuery);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <section 
      className="relative py-20 md:py-32"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Content */}
          <div className="animate-luxury-fade">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-6 bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
              {t.home.title}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              {t.home.subtitle}
            </p>
          </div>

          {/* Search Bar */}
          <div className="animate-luxury-scale">
            <div className="max-w-2xl mx-auto mb-8">
              <div className="flex flex-col md:flex-row gap-4 p-2 bg-card border border-border rounded-2xl shadow-luxury">
                {/* Location Button */}
                <Button
                  variant="ghost"
                  onClick={onLocationClick}
                  className="flex items-center justify-center space-x-2 px-4 py-3 text-muted-foreground hover:text-primary"
                >
                  <MapPin className="h-5 w-5" />
                  <span className="hidden md:inline">{t.nav.location}</span>
                </Button>

                {/* Search Input */}
                <div className="flex-1 relative">
                  <Input
                    type="text"
                    placeholder={t.home.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 py-3 text-lg border-0 bg-transparent focus:ring-0 focus:outline-none"
                  />
                </div>

                {/* Search Button */}
                <Button
                  onClick={handleSearch}
                  className="luxury-button px-8 py-3 text-lg font-semibold"
                >
                  <Search className="h-5 w-5 mr-2" />
                  {t.actions.search}
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={`flex flex-col md:flex-row gap-4 justify-center items-center ${isRTL ? 'space-x-reverse' : ''}`}>
              <Button 
                variant="outline" 
                size="lg"
                className="px-8 py-3 text-lg border-2 hover:border-primary hover:bg-primary/5"
                onClick={() => window.location.href = '/services'}
              >
                {t.home.findServices}
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="px-8 py-3 text-lg border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => window.location.href = '/auth'}
              >
                {t.home.becomeProvider}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};