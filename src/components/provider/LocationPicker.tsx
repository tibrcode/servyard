import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Navigation, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isValidCoordinates } from "@/lib/geolocation";

interface LocationPickerProps {
  currentLanguage: string;
  value?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  onChange: (location: {
    latitude: number;
    longitude: number;
    address?: string;
  }) => void;
  isRTL?: boolean;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  currentLanguage,
  value,
  onChange,
  isRTL = false
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [manualLat, setManualLat] = useState(value?.latitude?.toString() || "");
  const [manualLon, setManualLon] = useState(value?.longitude?.toString() || "");

  const t = {
    title: isRTL ? "تحديد الموقع" : "Set Location",
    description: isRTL 
      ? "حدد موقعك الجغرافي لتظهر خدماتك للعملاء القريبين" 
      : "Set your geographic location to show your services to nearby customers",
    getCurrentLocation: isRTL ? "استخدام موقعي الحالي" : "Use My Current Location",
    manualEntry: isRTL ? "إدخال يدوي" : "Manual Entry",
    latitude: isRTL ? "خط العرض" : "Latitude",
    longitude: isRTL ? "خط الطول" : "Longitude",
    saveManual: isRTL ? "حفظ الإحداثيات" : "Save Coordinates",
    locationSet: isRTL ? "تم تعيين الموقع بنجاح!" : "Location Set Successfully!",
    noLocation: isRTL ? "لم يتم تحديد الموقع بعد" : "Location Not Set Yet",
    errorPermission: isRTL ? "تم رفض إذن الموقع" : "Location permission denied",
    errorUnavailable: isRTL ? "معلومات الموقع غير متاحة" : "Location information unavailable",
    errorTimeout: isRTL ? "انتهت مهلة طلب الموقع" : "Location request timed out",
    errorGeneric: isRTL ? "حدث خطأ في الحصول على الموقع" : "Error getting location",
    errorInvalidCoords: isRTL ? "إحداثيات غير صالحة" : "Invalid coordinates",
    locating: isRTL ? "جاري تحديد موقعك..." : "Locating...",
    accuracy: isRTL ? "الدقة" : "Accuracy",
    howToFind: isRTL ? "كيف أجد إحداثياتي؟" : "How to find my coordinates?",
    howToFindDesc: isRTL 
      ? "افتح خرائط Google، انقر بزر الماوس الأيمن على موقعك، واختر الأرقام أعلى القائمة لنسخ الإحداثيات"
      : "Open Google Maps, right-click on your location, and select the numbers at the top to copy coordinates"
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError(t.errorGeneric);
      return;
    }

    setLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        onChange({
          latitude,
          longitude,
          address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        });

        setManualLat(latitude.toFixed(6));
        setManualLon(longitude.toFixed(6));
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError(t.errorPermission);
            break;
          case error.POSITION_UNAVAILABLE:
            setError(t.errorUnavailable);
            break;
          case error.TIMEOUT:
            setError(t.errorTimeout);
            break;
          default:
            setError(t.errorGeneric);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  const handleManualSave = () => {
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);

    if (isNaN(lat) || isNaN(lon)) {
      setError(t.errorInvalidCoords);
      return;
    }

    if (!isValidCoordinates({ latitude: lat, longitude: lon })) {
      setError(t.errorInvalidCoords);
      return;
    }

    onChange({
      latitude: lat,
      longitude: lon,
      address: `${lat.toFixed(6)}, ${lon.toFixed(6)}`
    });

    setError("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* زر الموقع الحالي */}
        <Button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={loading}
          className="w-full"
          variant="outline"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t.locating}
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4 mr-2" />
              {t.getCurrentLocation}
            </>
          )}
        </Button>

        {/* عرض الموقع الحالي */}
        {value && isValidCoordinates(value) && (
          <Alert>
            <CheckCircle2 className="w-4 h-4" />
            <AlertDescription>
              <div className="font-semibold">{t.locationSet}</div>
              <div className="text-sm mt-1">
                {t.latitude}: {value.latitude.toFixed(6)}<br />
                {t.longitude}: {value.longitude.toFixed(6)}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* رسالة الخطأ */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* الإدخال اليدوي */}
        <div className="pt-4 border-t space-y-4">
          <div className="text-sm font-medium">{t.manualEntry}</div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">{t.latitude}</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                placeholder="31.9454"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">{t.longitude}</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                placeholder="35.9284"
                value={manualLon}
                onChange={(e) => setManualLon(e.target.value)}
              />
            </div>
          </div>

          <Button
            type="button"
            onClick={handleManualSave}
            variant="secondary"
            className="w-full"
          >
            {t.saveManual}
          </Button>

          {/* تعليمات */}
          <Alert>
            <AlertDescription className="text-xs">
              <div className="font-semibold">{t.howToFind}</div>
              <div className="mt-1">{t.howToFindDesc}</div>
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationPicker;
