import React, { useEffect, useRef, useState, useCallback } from "react";
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
  height = "500px",
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

  // تحميل Google Maps API مع معالجة أفضل للأخطاء
  useEffect(() => {
    let mounted = true;
    
    // إضافة CSS لإخفاء الإطار الأبيض من InfoWindow وتصغير زر الإغلاق
    const style = document.createElement('style');
    style.innerHTML = `
      .gm-style-iw-c {
        padding: 0 !important;
        border-radius: 8px !important;
        box-shadow: 0 2px 7px 1px rgba(0,0,0,0.3) !important;
      }
      .gm-style-iw-d {
        overflow: hidden !important;
      }
      .gm-ui-hover-effect {
        top: 2px !important;
        right: 2px !important;
        width: 24px !important;
        height: 24px !important;
      }
      .gm-ui-hover-effect > span {
        margin: 4px !important;
        width: 16px !important;
        height: 16px !important;
      }
      .gm-style .gm-style-iw-tc {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
    
    // التحقق من تحميل API (محمّل من index.html)
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps) {
        console.log('✅ InteractiveMap: Google Maps API ready');
        if (mounted) {
          setApiLoaded(true);
          setLoading(false);
          setError('');
        }
        return true;
      }
      return false;
    };

    // تحقق فوري
    if (checkGoogleMaps()) return () => { mounted = false; };

    console.log('⏳ Waiting for Google Maps API...');
    
    // انتظار callback من index.html
    let attempts = 0;
    const maxAttempts = 100; // 10 ثواني (100 * 100ms)
    
    const checkInterval = setInterval(() => {
      attempts++;
      if (checkGoogleMaps()) {
        clearInterval(checkInterval);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        if (mounted) {
          console.error('❌ Google Maps API failed to load after 10s');
          console.error('Check: 1) API Key validity, 2) API is enabled in Google Cloud, 3) Network connection');
          setError(t.error + ' - Please check API Key configuration');
          setLoading(false);
        }
      }
    }, 100);

    return () => {
      mounted = false;
      clearInterval(checkInterval);
    };
  }, []);

  // إنشاء الخريطة (مرة واحدة فقط)
  useEffect(() => {
    if (!apiLoaded || !mapRef.current || mapInstanceRef.current) return;

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
  }, [apiLoaded]);

  // تحديث موقع ومستوى التكبير للخريطة
  useEffect(() => {
    if (!mapInstanceRef.current || !center) return;

    mapInstanceRef.current.setCenter({ 
      lat: center.latitude, 
      lng: center.longitude 
    });
    mapInstanceRef.current.setZoom(zoom);
  }, [center, zoom]);

  // تحديث العلامات على الخريطة
  useEffect(() => {
    // انتظار تحميل API وإنشاء الخريطة
    if (!apiLoaded || !mapInstanceRef.current) {
      return;
    }

    // حذف العلامات القديمة
    clearMarkers();
    
    // إضافة العلامات الجديدة
    markers.forEach((marker) => {
      addMarker(marker, marker.label);
    });
  }, [apiLoaded, markers, currentLanguage]);

  // مراقبة التغيير بين النمط الليلي والنهاري
  useEffect(() => {
    if (!apiLoaded || !mapInstanceRef.current) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          // إعادة رسم العلامات عند تغيير النمط
          clearMarkers();
          markers.forEach((marker) => {
            addMarker(marker, marker.label);
          });
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, [apiLoaded, markers]);

  // إضافة علامة محسّنة مع معلومات الخدمات
  const addMarker = (location: Location, label?: string, draggable = false) => {
    if (!mapInstanceRef.current) return;

    const isRTL = currentLanguage === 'ar';

    // استخدام Marker العادي (AdvancedMarker يحتاج Map ID من Google Console)
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

    // إضافة info window محسّن مع كل الخدمات
    if (label || location.services) {
      let content = '';
      
      if (location.services && location.services.length > 0) {
        // عرض قائمة الخدمات بتصميم جميل
        const providerName = location.services[0].provider_name;
        const servicesCount = location.services.length;
        
        // الكشف عن الوضع الليلي - نستخدم MutationObserver لمراقبة التغييرات
        const checkDarkMode = () => document.documentElement.classList.contains('dark');
        const isDarkMode = checkDarkMode();
        
        // ألوان تتكيف مع الوضع الليلي/النهاري
        const colors = isDarkMode ? {
          background: '#1b1f22',
          text: '#e5e7eb',
          textSecondary: '#9ca3af',
          border: '#374151',
          hover: '#374151',
          headerBg: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
        } : {
          background: '#ffffff',
          text: '#111827',
          textSecondary: '#6b7280',
          border: '#e5e7eb',
          hover: '#f3f4f6',
          headerBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        };
        
        content = `
          <div style="
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            width: 280px;
            padding: 0;
            direction: ${isRTL ? 'rtl' : 'ltr'};
            background: ${colors.background};
            color: ${colors.text};
            box-sizing: border-box;
            border-radius: 8px;
            overflow: hidden;
          ">
            <!-- Header -->
            <div style="
              background: ${colors.headerBg};
              color: white;
              padding: 12px 16px;
              border-radius: 8px 8px 0 0;
            ">
              <div style="
                font-size: 14px; 
                font-weight: 600; 
                margin-bottom: 4px;
                overflow-x: auto;
                overflow-y: hidden;
                white-space: nowrap;
                -webkit-overflow-scrolling: touch;
              ">
                ${providerName}
              </div>
              <div style="font-size: 11px; opacity: 0.9;">
                ${isRTL ? `${servicesCount} خدمة متوفرة` : `${servicesCount} services available`}
              </div>
            </div>
            
            <!-- Services List -->
            <div style="
              max-height: 250px; 
              overflow-y: auto; 
              overflow-x: hidden; 
              padding: 10px 14px;
              -webkit-overflow-scrolling: touch;
            ">
              ${location.services.map((service, index) => `
                <div style="
                  padding: 7px 6px;
                  border-bottom: ${index < location.services!.length - 1 ? `1px solid ${colors.border}` : 'none'};
                  cursor: pointer;
                  transition: background 0.2s;
                  border-radius: 4px;
                " 
                onmouseover="this.style.background='${colors.hover}'"
                onmouseout="this.style.background='transparent'"
                onclick="window.handleServiceClick?.('${service.id}')">
                  <div style="
                    font-size: 13px;
                    font-weight: 500;
                    color: ${colors.text};
                    margin-bottom: 3px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  ">
                    ${service.name}
                  </div>
                  <div style="
                    font-size: 12px;
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
              padding: 10px 16px 12px 16px;
              border-top: 1px solid ${colors.border};
              border-radius: 0 0 8px 8px;
            ">
              <div style="
                color: ${colors.textSecondary};
                font-size: 10px;
                line-height: 1.5;
                overflow-x: auto;
                overflow-y: hidden;
                white-space: nowrap;
                -webkit-overflow-scrolling: touch;
              ">
                ${isRTL ? '👆 اضغط على أي خدمة لعرض التفاصيل' : '👆 Click any service to view details'}
              </div>
            </div>
          </div>
        `;
      } else {
        // fallback للـ label العادي
        const isDarkMode = document.documentElement.classList.contains('dark');
        const bgColor = isDarkMode ? '#1b1f22' : '#ffffff';
        const textColor = isDarkMode ? '#e5e7eb' : '#111827';
        content = `<div style="padding: 8px; font-weight: 500; background: ${bgColor}; color: ${textColor}; border-radius: 8px;">${label}</div>`;
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
        
        // إضافة علامة الموقع الحالي (بدون حذف علامات الخدمات)
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
      <CardContent className="p-0">
        <div 
          ref={mapRef} 
          style={{ width: '100%', height }}
          className="overflow-hidden"
        />
      </CardContent>
    </Card>
  );
};

export default InteractiveMap;
