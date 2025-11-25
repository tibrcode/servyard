import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Navigation, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isValidCoordinates } from "@/lib/geolocation";
import { useTranslation } from "@/lib/i18n";

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
  isRTL: isRTLProp = false
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [manualLat, setManualLat] = useState(value?.latitude?.toString() || "");
  const [manualLon, setManualLon] = useState(value?.longitude?.toString() || "");

  const { t, isRTL } = useTranslation(currentLanguage as 'ar' | 'en');

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError(t.locationPicker?.errorGeneric || 'Error getting location');
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
      (geoError) => {
        setLoading(false);
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            setError(t.locationPicker?.errorPermission || 'Location permission denied');
            break;
          case geoError.POSITION_UNAVAILABLE:
            setError(t.locationPicker?.errorUnavailable || 'Location information unavailable');
            break;
          case geoError.TIMEOUT:
            setError(t.locationPicker?.errorTimeout || 'Location request timed out');
            break;
          default:
            setError(t.locationPicker?.errorGeneric || 'Error getting location');
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
      setError(t.locationPicker?.errorInvalidCoords || 'Invalid coordinates');
      return;
    }

    if (!isValidCoordinates({ latitude: lat, longitude: lon })) {
      setError(t.locationPicker?.errorInvalidCoords || 'Invalid coordinates');
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
          {t.locationPicker?.title || 'Set Location'}
        </CardTitle>
        <CardDescription>{t.locationPicker?.description || 'Set your geographic location to show your services to nearby customers'}</CardDescription>
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
              {t.locationPicker?.locating || 'Locating...'}
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4 mr-2" />
              {t.locationPicker?.getCurrentLocation || 'Use My Current Location'}
            </>
          )}
        </Button>

        {/* عرض الموقع الحالي */}
        {value && isValidCoordinates(value) && (
          <Alert>
            <CheckCircle2 className="w-4 h-4" />
            <AlertDescription>
              <div className="font-semibold">{t.locationPicker?.locationSet || 'Location Set Successfully!'}</div>
              <div className="text-sm mt-1">
                {t.locationPicker?.latitude || 'Latitude'}: {value.latitude.toFixed(6)}<br />
                {t.locationPicker?.longitude || 'Longitude'}: {value.longitude.toFixed(6)}
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
          <div className="text-sm font-medium">{t.locationPicker?.manualEntry || 'Manual Entry'}</div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">{t.locationPicker?.latitude || 'Latitude'}</Label>
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
              <Label htmlFor="longitude">{t.locationPicker?.longitude || 'Longitude'}</Label>
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
            {t.locationPicker?.saveManual || 'Save Coordinates'}
          </Button>

          {/* تعليمات */}
          <Alert>
            <AlertDescription className="text-xs">
              <div className="font-semibold">{t.locationPicker?.howToFind || 'How to find my coordinates?'}</div>
              <div className="mt-1">{t.locationPicker?.howToFindDesc || 'Open Google Maps, right-click on your location, and select the numbers at the top to copy coordinates'}</div>
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationPicker;
