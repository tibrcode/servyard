import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Navigation, Loader2 } from "lucide-react";

interface Location {
  latitude: number;
  longitude: number;
  label?: string;
}

interface InteractiveMapProps {
  center?: Location;
  markers?: Location[];
  onLocationSelect?: (location: Location) => void;
  height?: string;
  currentLanguage: string;
  showCurrentLocation?: boolean;
  zoom?: number;
}

/**
 * مكون خريطة تفاعلية باستخدام Google Maps
 * Interactive map component using Google Maps
 * 
 * ملاحظة: يتطلب Google Maps API Key
 * Note: Requires Google Maps API Key
 * 
 * لإضافة API Key:
 * 1. انتقل إلى: https://console.cloud.google.com/
 * 2. فعّل Maps JavaScript API
 * 3. أنشئ API Key
 * 4. أضف في .env.local:
 *    VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
 */
const InteractiveMap: React.FC<InteractiveMapProps> = ({
  center,
  markers = [],
  onLocationSelect,
  height = "400px",
  currentLanguage,
  showCurrentLocation = true,
  zoom = 12
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [apiLoaded, setApiLoaded] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);

  const isRTL = currentLanguage === 'ar';

  const t = {
    title: isRTL ? "الخريطة التفاعلية" : "Interactive Map",
    description: isRTL 
      ? "انقر على الخريطة لتحديد موقع أو اسحب العلامة" 
      : "Click on map to select location or drag the marker",
    loading: isRTL ? "جاري تحميل الخريطة..." : "Loading map...",
    error: isRTL ? "خطأ في تحميل الخريطة" : "Error loading map",
    apiKeyMissing: isRTL 
      ? "يرجى إضافة Google Maps API Key في ملف .env.local"
      : "Please add Google Maps API Key in .env.local",
    getCurrentLocation: isRTL ? "موقعي الحالي" : "My Location",
    clickToSelect: isRTL ? "انقر لتحديد الموقع" : "Click to select location"
  };

  // تحميل Google Maps API
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setError(t.apiKeyMissing);
      setLoading(false);
      return;
    }

    // التحقق إذا كان API محمّل مسبقاً
    if (window.google && window.google.maps) {
      setApiLoaded(true);
      setLoading(false);
      return;
    }

    // تحميل Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=${currentLanguage}`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setApiLoaded(true);
      setLoading(false);
    };
    
    script.onerror = () => {
      setError(t.error);
      setLoading(false);
    };
    
    document.head.appendChild(script);

    return () => {
      // لا نحذف script لأنه قد يُستخدم في مكونات أخرى
    };
  }, []);

  // إنشاء الخريطة
  useEffect(() => {
    if (!apiLoaded || !mapRef.current) return;

    const defaultCenter = center || { latitude: 31.9454, longitude: 35.9284 }; // عمّان، الأردن

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: defaultCenter.latitude, lng: defaultCenter.longitude },
      zoom: zoom,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
    });

    mapInstanceRef.current = map;

    // إضافة event listener للنقر
    if (onLocationSelect) {
      map.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          const location: Location = {
            latitude: event.latLng.lat(),
            longitude: event.latLng.lng()
          };
          onLocationSelect(location);
          
          // إضافة/تحديث العلامة
          clearMarkers();
          addMarker(location, t.clickToSelect, true);
        }
      });
    }

    // إضافة العلامات
    markers.forEach(marker => addMarker(marker, marker.label));

  }, [apiLoaded, center, zoom]);

  // إضافة علامة
  const addMarker = (location: Location, label?: string, draggable = false) => {
    if (!mapInstanceRef.current) return;

    const marker = new google.maps.Marker({
      position: { lat: location.latitude, lng: location.longitude },
      map: mapInstanceRef.current,
      title: label || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
      draggable: draggable,
      animation: google.maps.Animation.DROP
    });

    // إذا كانت العلامة قابلة للسحب
    if (draggable && onLocationSelect) {
      marker.addListener('dragend', (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          const location: Location = {
            latitude: event.latLng.lat(),
            longitude: event.latLng.lng()
          };
          onLocationSelect(location);
        }
      });
    }

    // إضافة info window
    if (label) {
      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="padding: 8px; font-weight: 500;">${label}</div>`
      });
      
      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current!, marker);
      });
    }

    markersRef.current.push(marker);
  };

  // حذف جميع العلامات
  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
  };

  // الحصول على الموقع الحالي
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        
        setCurrentLocation(location);
        
        // تحريك الخريطة للموقع الحالي
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo({ 
            lat: location.latitude, 
            lng: location.longitude 
          });
          mapInstanceRef.current.setZoom(15);
        }
        
        // إضافة علامة
        clearMarkers();
        addMarker(location, t.getCurrentLocation, true);
        
        if (onLocationSelect) {
          onLocationSelect(location);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
      }
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">{t.loading}</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          <div className="font-semibold mb-2">{t.error}</div>
          <div className="text-sm">{error}</div>
          {error.includes('API Key') && (
            <div className="mt-2 text-xs">
              <code className="bg-muted p-1 rounded">
                VITE_GOOGLE_MAPS_API_KEY=your_key_here
              </code>
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {t.title}
            </CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </div>
          
          {showCurrentLocation && (
            <Button
              onClick={handleGetCurrentLocation}
              variant="outline"
              size="sm"
            >
              <Navigation className="w-4 h-4 mr-2" />
              {t.getCurrentLocation}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div 
          ref={mapRef} 
          style={{ width: '100%', height }}
          className="rounded-lg overflow-hidden border"
        />
      </CardContent>
    </Card>
  );
};

export default InteractiveMap;
