import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { getCategoryLabel } from "@/lib/categoriesLocale";
import CategoryCard from "@/components/CategoryCard";
import { useServiceCategories } from "@/hooks/useServiceCategories";
import { iconMap, colorMap } from "@/lib/categoryIcons";

interface ServiceCategoriesProps {
  currentLanguage?: string;
  onCategoryClick?: (category: string) => void;
}

export const ServiceCategories = ({
  currentLanguage = 'en',
  onCategoryClick
}: ServiceCategoriesProps) => {
  const { t, isRTL } = useTranslation(currentLanguage);
  const { data: categories = [], isLoading: loading } = useServiceCategories();
  const [unifiedTitleSize, setUnifiedTitleSize] = useState<number | null>(null);

  // Reset unified size when language or categories change
  useEffect(() => {
    setUnifiedTitleSize(null);
  }, [currentLanguage, categories]);



  if (loading) {
    return (
      <section className="py-12" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              {t.home.featuredCategories}
            </h2>
          </div>
          <div className="grid grid-cols-2 xs:grid-cols-3 gap-3 px-3 md:[grid-template-columns:repeat(auto-fit,minmax(180px,1fr))] md:gap-4 md:px-4 lg:[grid-template-columns:repeat(auto-fit,minmax(200px,1fr))] lg:gap-5 lg:px-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl border border-white/10 bg-card animate-pulse flex flex-col items-center justify-center text-center p-4">
                <div className="w-14 h-14 md:w-16 md:h-16 mb-3 md:mb-4 rounded-xl bg-muted"></div>
                <div className="h-3.5 md:h-4 bg-muted rounded w-4/5"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="py-10 md:py-12"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-4xl font-display font-bold mb-4">
            {t.home.featuredCategories}
          </h2>
        </div>

  {/* Categories Grid: 2 cols on very narrow phones, 3 cols otherwise; auto-fit on desktop */}
  <div className="grid grid-cols-2 xs:grid-cols-3 gap-3 px-1.5 md:[grid-template-columns:repeat(auto-fit,minmax(180px,1fr))] md:gap-4 md:px-4 lg:[grid-template-columns:repeat(auto-fit,minmax(200px,1fr))] lg:gap-5 lg:px-6">
          {categories.map((category) => {
            const IconComponent = iconMap[category.icon_name || 'Users'] || Users;
            const colors = colorMap[category.color_scheme || 'blue'];
            const categoryName = getCategoryLabel(category as any, currentLanguage);

            const icon = (
              <div className={`mb-1.5 opacity-90 ${colors.bg} rounded-xl w-11 h-11 md:w-16 md:h-16 flex items-center justify-center`}>
                <IconComponent className={`w-5 h-5 md:w-6 md:h-6 ${colors.text}`} />
              </div>
            );

            return (
              <CategoryCard
                key={category.id}
                icon={icon}
                title={categoryName}
                unifiedSize={null}
                onTitleFit={undefined}
                onClick={() => onCategoryClick?.(category.id)}
              />
            );
          })}
        </div>

        {/* View All Button */}
        <div className="text-center mt-10">
          <Button
            className="luxury-button px-8 py-3 text-lg font-semibold"
            onClick={() => onCategoryClick?.('all')}
          >
            {t.userInterface.browseServices}
          </Button>
        </div>
      </div>
    </section>
  );
};