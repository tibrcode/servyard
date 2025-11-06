import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Navigation, Loader2 } from "lucide-react";

interface Location {
  latitude: number;
  longitude: number;
  label?: string;
  services?: Array<{
    id: string;
    name: string;
    price: string;
    provider_name: string;
  }>;
}

interface InteractiveMapProps {
  center?: Location;
  markers?: Location[];
  onLocationSelect?: (location: Location) => void;
  onServiceClick?: (serviceId: string) => void;
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
  onServiceClick,
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
    // التحقق من تحميل API (محمّل من index.html)
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps) {
        console.log('✅ InteractiveMap: Google Maps API ready');
        setApiLoaded(true);
        setLoading(false);
        return true;
      }
      return false;
    };

    // تحقق فوري
    if (checkGoogleMaps()) return;

    // انتظار callback من index.html
    const checkInterval = setInterval(() => {
      if (checkGoogleMaps()) {
        clearInterval(checkInterval);
      }
    }, 100);

    // timeout بعد 10 ثواني
    const timeoutId = setTimeout(() => {
      if (!window.google || !window.google.maps) {
        console.error('❌ Google Maps API failed to load after 10s');
        setError(t.error);
        setLoading(false);
      }
      clearInterval(checkInterval);
    }, 10000);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeoutId);
    };
  }, []);

  // إنشاء الخريطة (مرة واحدة فقط)
  useEffect(() => {
    if (!apiLoaded || !mapRef.current || mapInstanceRef.current) return;

    const defaultCenter = center || { latitude: 31.9454, longitude: 35.9284 }; // عمّان، الأردن

    console.log('🗺️ Creating new Google Map instance...');
    const map = new google.maps.Map(mapRef.current, {
      center: { lat: defaultCenter.latitude, lng: defaultCenter.longitude },
      zoom: zoom,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
    });

    mapInstanceRef.current = map;
    console.log('✅ Map instance created');

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
  }, [apiLoaded]);

  // تحديث المركز والزوم عند تغييرهم
  useEffect(() => {
    if (!mapInstanceRef.current || !center) return;
    
    mapInstanceRef.current.setCenter({ lat: center.latitude, lng: center.longitude });
    mapInstanceRef.current.setZoom(zoom);
  }, [center, zoom]);

  // تحديث العلامات عند تغييرها
  useEffect(() => {
    if (!mapInstanceRef.current) {
      console.log('❌ Cannot update markers: mapInstanceRef is null');
      return;
    }

    console.log('🗺️ Updating markers:', markers.length);
    console.log('  Map instance exists:', !!mapInstanceRef.current);
    
    // حذف العلامات القديمة
    console.log('  Clearing old markers...');
    clearMarkers();
    console.log('  Old markers cleared');
    
    // إضافة العلامات الجديدة
    markers.forEach((marker, index) => {
      console.log(`  Adding Marker ${index + 1}:`, marker.label, `at (${marker.latitude}, ${marker.longitude})`);
      addMarker(marker, marker.label);
    });

    console.log('✅ Markers updated on map. Total markers now:', markersRef.current.length);
  }, [markers, currentLanguage]);

  // إضافة علامة محسّنة مع معلومات الخدمات
  const addMarker = (location: Location, label?: string, draggable = false) => {
    if (!mapInstanceRef.current) {
      console.log('❌ addMarker: mapInstanceRef is null');
      return;
    }

    const isRTL = currentLanguage === 'ar';

    console.log('  📍 Creating marker at:', location.latitude, location.longitude);
    
    // استخدام Marker العادي (AdvancedMarker يحتاج Map ID من Google Console)
    const marker = new google.maps.Marker({
      position: { lat: location.latitude, lng: location.longitude },
      map: mapInstanceRef.current,
      title: label || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
      draggable: draggable,
      animation: google.maps.Animation.DROP
    });
    
    console.log('  ✅ Marker created successfully');

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

    // إضافة info window محسّن مع كل الخدمات
    if (label || location.services) {
      let content = '';
      
      if (location.services && location.services.length > 0) {
        // عرض قائمة الخدمات بتصميم جميل
        const providerName = location.services[0].provider_name;
        const servicesCount = location.services.length;
        
        content = `
          <div style="
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            min-width: 280px;
            max-width: 400px;
            padding: 0;
            direction: ${isRTL ? 'rtl' : 'ltr'};
          ">
            <!-- Header -->
            <div style="
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
              color: white;
              padding: 12px 16px;
              border-radius: 8px 8px 0 0;
              margin: -12px -16px 12px -16px;
            ">
              <div style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">
                ${providerName}
              </div>
              <div style="font-size: 12px; opacity: 0.9;">
                ${isRTL ? `${servicesCount} خدمة متوفرة` : `${servicesCount} services available`}
              </div>
            </div>
            
            <!-- Services List -->
            <div style="max-height: 300px; overflow-y: auto;">
              ${location.services.map((service, index) => `
                <div style="
                  padding: 10px 0;
                  border-bottom: ${index < location.services!.length - 1 ? '1px solid #e5e7eb' : 'none'};
                  cursor: pointer;
                  transition: background 0.2s;
                " 
                onmouseover="this.style.background='#f3f4f6'"
                onmouseout="this.style.background='transparent'"
                onclick="window.handleServiceClick?.('${service.id}')">
                  <div style="
                    font-size: 14px;
                    font-weight: 500;
                    color: #111827;
                    margin-bottom: 4px;
                  ">
                    ${service.name}
                  </div>
                  <div style="
                    font-size: 13px;
                    color: #f59e0b;
                    font-weight: 600;
                  ">
                    ${service.price}
                  </div>
                </div>
              `).join('')}
            </div>
            
            <!-- Footer -->
            <div style="
              margin-top: 12px;
              padding-top: 12px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
            ">
              <div style="
                color: #6b7280;
                font-size: 11px;
              ">
                ${isRTL ? '👆 اضغط على أي خدمة لعرض التفاصيل' : '👆 Click any service to view details'}
              </div>
            </div>
          </div>
        `;
      } else {
        // fallback للـ label العادي
        content = `<div style="padding: 8px; font-weight: 500;">${label}</div>`;
      }
      
      const infoWindow = new google.maps.InfoWindow({
        content: content
      });
      
      // تفعيل callback للخدمات
      if (onServiceClick) {
        (window as any).handleServiceClick = (serviceId: string) => {
          onServiceClick(serviceId);
          infoWindow.close();
        };
      }
      
      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current!, marker);
      });
    }

    markersRef.current.push(marker);
  };

  // حذف جميع العلامات
  const clearMarkers = () => {
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
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
