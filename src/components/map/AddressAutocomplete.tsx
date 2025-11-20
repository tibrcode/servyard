import React, { useRef, useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Loader2 } from "lucide-react";

interface AddressAutocompleteProps {
  onAddressSelect: (address: {
    fullAddress: string;
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  }) => void;
  currentLanguage: string;
  placeholder?: string;
  label?: string;
}

/**
 * مكون Auto-complete للعناوين باستخدام Google Places API
 * Address Autocomplete component using Google Places API
 * 
 * المميزات:
 * - اقتراحات تلقائية أثناء الكتابة
 * - تحويل العنوان إلى إحداثيات
 * - دعم جميع الدول
 * - دعم RTL
 */
const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  onAddressSelect,
  currentLanguage,
  placeholder,
  label
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState("");

  const isRTL = currentLanguage === 'ar';

  const defaultLabel = label || (isRTL ? "العنوان" : "Address");
  const defaultPlaceholder = placeholder || (isRTL 
    ? "ابدأ الكتابة للبحث عن عنوان..."
    : "Start typing to search for an address..."
  );

  const initializeAutocomplete = useCallback(() => {
    if (!inputRef.current) return;

    // إنشاء Autocomplete
    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      fields: ['address_components', 'formatted_address', 'geometry', 'name'],
      types: ['address'], // البحث عن العناوين فقط
    });

    autocompleteRef.current = autocomplete;

    // عند اختيار عنوان
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();

      if (!place.geometry || !place.geometry.location) {
        console.error('No geometry for place');
        return;
      }

      // استخراج البيانات
      const latitude = place.geometry.location.lat();
      const longitude = place.geometry.location.lng();
      const fullAddress = place.formatted_address || '';

      let city = '';
      let country = '';

      // استخراج المدينة والبلد من address_components
      if (place.address_components) {
        place.address_components.forEach(component => {
          if (component.types.includes('locality')) {
            city = component.long_name;
          }
          if (component.types.includes('country')) {
            country = component.long_name;
          }
        });
      }

      // إرسال البيانات للـ parent component
      onAddressSelect({
        fullAddress,
        latitude,
        longitude,
        city,
        country
      });

      setValue(fullAddress);
    });
  }, [onAddressSelect]);

  useEffect(() => {
    // التحقق من تحميل Google Places API
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        initializeAutocomplete();
        setLoading(false);
      } else {
        // إعادة المحاولة بعد 100ms
        setTimeout(checkGoogleMaps, 100);
      }
    };

    checkGoogleMaps();
  }, [initializeAutocomplete]);

  if (loading) {
    return (
      <div className="space-y-2">
        <Label>{defaultLabel}</Label>
        <div className="flex items-center gap-2 p-2 border rounded-md">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm text-muted-foreground">
            {isRTL ? "جاري التحميل..." : "Loading..."}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="address-autocomplete" className="flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        {defaultLabel}
      </Label>
      <Input
        ref={inputRef}
        id="address-autocomplete"
        type="text"
        placeholder={defaultPlaceholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        dir={isRTL ? 'rtl' : 'ltr'}
      />
    </div>
  );
};

export default AddressAutocomplete;
