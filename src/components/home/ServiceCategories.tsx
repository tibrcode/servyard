import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Stethoscope,
  Home,
  Car,
  GraduationCap,
  Scissors,
  Dumbbell,
  Laptop,
  Scale,
  DollarSign,
  Sparkles,
  Wrench,
  Users,
  Heart,
  Cog,
  Palette,
  Shirt,
  Code,
  Building,
  Megaphone,
  Camera,
  Languages,
  Briefcase,
  Calendar,
  Sofa,
  PenTool,
  Music,
  Plane
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { getCategoryLabel } from "@/lib/categoriesLocale";
import CategoryCard from "@/components/CategoryCard";
import { useServiceCategories } from "@/hooks/useServiceCategories";

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

  // Icon mapping
  const iconMap: { [key: string]: any } = {
    'Sparkles': Sparkles,
    'Wrench': Wrench,
    'Heart': Heart,
    'Dumbbell': Dumbbell,
    'Scissors': Scissors,
    'GraduationCap': GraduationCap,
    'Stethoscope': Stethoscope,
    'Home': Home,
    'Car': Car,
    'Laptop': Laptop,
    'Scale': Scale,
    'DollarSign': DollarSign,
    'Users': Users,
    'Cog': Cog,
    'Palette': Palette,
    'Shirt': Shirt,
    'Code': Code,
    'Building': Building,
    'Megaphone': Megaphone,
    'Camera': Camera,
    'Languages': Languages,
    'Briefcase': Briefcase,
    'Calendar': Calendar,
    'Sofa': Sofa,
    'PenTool': PenTool,
    'Music': Music,
    'Plane': Plane
  };

  // Color mapping
  const colorMap: { [key: string]: { text: string; bg: string } } = {
    'blue': { text: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20' },
    'orange': { text: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/20' },
    'red': { text: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/20' },
    'green': { text: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/20' },
    'pink': { text: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-950/20' },
    'purple': { text: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/20' },
    'slate': { text: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-950/20' },
    'gray': { text: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-950/20' },
    'violet': { text: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-950/20' },
    'rose': { text: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/20' },
    'emerald': { text: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
    'amber': { text: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20' },
    'cyan': { text: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-950/20' },
    'indigo': { text: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/20' },
    'teal': { text: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-950/20' },
    'stone': { text: 'text-stone-500', bg: 'bg-stone-50 dark:bg-stone-950/20' },
    'lime': { text: 'text-lime-500', bg: 'bg-lime-50 dark:bg-lime-950/20' },
    'sky': { text: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-950/20' },
    'yellow': { text: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/20' },
  };



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