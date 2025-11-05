import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AdvancedSearchFiltersProps {
  onFilterChange: (filters: {
    country?: string;
    city?: string;
    hasLocation?: boolean;
  }) => void;
  currentLanguage: string;
  availableCountries?: string[];
  availableCities?: string[];
}

/**
 * مكون فلاتر البحث المتقدم
 * Advanced Search Filters Component
 * 
 * المميزات:
 * - فلترة حسب البلد
 * - فلترة حسب المدينة
 * - فلترة المزودين الذين لديهم موقع فقط
 * - إعادة تعيين الفلاتر
 */
const AdvancedSearchFilters: React.FC<AdvancedSearchFiltersProps> = ({
  onFilterChange,
  currentLanguage,
  availableCountries = [],
  availableCities = []
}) => {
  const [country, setCountry] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [hasLocation, setHasLocation] = useState<boolean>(false);
  const [activeFilters, setActiveFilters] = useState(0);

  const isRTL = currentLanguage === 'ar';

  const t = {
    title: isRTL ? "البحث المتقدم" : "Advanced Search",
    country: isRTL ? "البلد" : "Country",
    city: isRTL ? "المدينة" : "City",
    allCountries: isRTL ? "جميع البلدان" : "All Countries",
    allCities: isRTL ? "جميع المدن" : "All Cities",
    onlyWithLocation: isRTL ? "فقط من لديهم موقع جغرافي" : "Only with geographic location",
    applyFilters: isRTL ? "تطبيق الفلاتر" : "Apply Filters",
    resetFilters: isRTL ? "إعادة تعيين" : "Reset",
    activeFilters: isRTL ? "فلاتر نشطة" : "Active Filters"
  };

  // عند تغيير الفلاتر
  useEffect(() => {
    let count = 0;
    if (country) count++;
    if (city) count++;
    if (hasLocation) count++;
    setActiveFilters(count);
  }, [country, city, hasLocation]);

  const handleApplyFilters = () => {
    onFilterChange({
      country: country || undefined,
      city: city || undefined,
      hasLocation: hasLocation || undefined
    });
  };

  const handleResetFilters = () => {
    setCountry("");
    setCity("");
    setHasLocation(false);
    onFilterChange({});
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            {t.title}
          </div>
          {activeFilters > 0 && (
            <Badge variant="secondary">
              {activeFilters} {t.activeFilters}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* فلتر البلد */}
        <div className="space-y-2">
          <Label>{t.country}</Label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger>
              <SelectValue placeholder={t.allCountries} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allCountries}</SelectItem>
              {availableCountries.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* فلتر المدينة */}
        <div className="space-y-2">
          <Label>{t.city}</Label>
          <Select value={city} onValueChange={setCity} disabled={!country || country === 'all'}>
            <SelectTrigger>
              <SelectValue placeholder={t.allCities} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allCities}</SelectItem>
              {availableCities.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* فلتر الموقع الجغرافي */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="has-location"
            checked={hasLocation}
            onChange={(e) => setHasLocation(e.target.checked)}
            className="w-4 h-4"
          />
          <Label htmlFor="has-location" className="cursor-pointer">
            {t.onlyWithLocation}
          </Label>
        </div>

        {/* أزرار التحكم */}
        <div className="flex gap-2 pt-2">
          <Button onClick={handleApplyFilters} className="flex-1">
            <Filter className="w-4 h-4 mr-2" />
            {t.applyFilters}
          </Button>
          {activeFilters > 0 && (
            <Button onClick={handleResetFilters} variant="outline">
              <X className="w-4 h-4 mr-2" />
              {t.resetFilters}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedSearchFilters;
