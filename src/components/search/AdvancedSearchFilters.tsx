import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n";

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

  const { t, isRTL } = useTranslation(currentLanguage as 'ar' | 'en');

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
            {t.advancedSearch?.title || 'Advanced Search'}
          </div>
          {activeFilters > 0 && (
            <Badge variant="secondary">
              {activeFilters} {t.advancedSearch?.activeFilters || 'Active Filters'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* فلتر البلد */}
        <div className="space-y-2">
          <Label>{t.advancedSearch?.country || 'Country'}</Label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger>
              <SelectValue placeholder={t.advancedSearch?.allCountries || 'All Countries'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.advancedSearch?.allCountries || 'All Countries'}</SelectItem>
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
          <Label>{t.advancedSearch?.city || 'City'}</Label>
          <Select value={city} onValueChange={setCity} disabled={!country || country === 'all'}>
            <SelectTrigger>
              <SelectValue placeholder={t.advancedSearch?.allCities || 'All Cities'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.advancedSearch?.allCities || 'All Cities'}</SelectItem>
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
            {t.advancedSearch?.onlyWithLocation || 'Only with geographic location'}
          </Label>
        </div>

        {/* أزرار التحكم */}
        <div className="flex gap-2 pt-2">
          <Button onClick={handleApplyFilters} className="flex-1">
            <Filter className="w-4 h-4 mr-2" />
            {t.advancedSearch?.applyFilters || 'Apply Filters'}
          </Button>
          {activeFilters > 0 && (
            <Button onClick={handleResetFilters} variant="outline">
              <X className="w-4 h-4 mr-2" />
              {t.advancedSearch?.resetFilters || 'Reset'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedSearchFilters;
