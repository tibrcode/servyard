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
    average_rating?: number;
    reviews_count?: number;
    currency?: string;
  }>;
  provider_rating?: number;
  provider_reviews_count?: number;
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
        border-radius: 0 !important;
        box-shadow: none !important;
        background: transparent !important;
        max-width: none !important;
      }
      .gm-style-iw-d {
        overflow: visible !important;
        max-width: none !important;
      }
      .gm-style .gm-style-iw {
        max-width: none !important;
      }
      .gm-ui-hover-effect {
        display: none !important;
      }
      .gm-style .gm-style-iw-tc {
        display: none !important;
      }
      .gm-style .gm-style-iw-t::after {
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
        // عرض قائمة الخدمات بتصميم احترافي عصري
        const providerName = location.services[0].provider_name;
        const servicesCount = location.services.length;
        
        const checkDarkMode = () => document.documentElement.classList.contains('dark');
        const isDarkMode = checkDarkMode();
        
        // ألوان احترافية
        const colors = isDarkMode ? {
          background: '#1a1d21',
          cardBg: '#242830',
          text: '#ffffff',
          textSecondary: '#9ca3af',
          border: '#2d3139',
          hover: '#2d3139',
          headerBg: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
          badge: '#065f46',
          star: '#fbbf24',
        } : {
          background: '#ffffff',
          cardBg: '#f9fafb',
          text: '#111827',
          textSecondary: '#6b7280',
          border: '#e5e7eb',
          hover: '#f3f4f6',
          headerBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          badge: '#d1fae5',
          star: '#fbbf24',
        };
        
        // دالة لعرض النجوم
        const renderStars = (rating: number) => {
          const fullStars = Math.floor(rating);
          const hasHalfStar = rating % 1 >= 0.5;
          let stars = '';
          
          for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
              stars += '★';
            } else if (i === fullStars && hasHalfStar) {
              stars += '⯨';
            } else {
              stars += '☆';
            }
          }
          return stars;
        };
        
        // حساب تقييم المزود (متوسط تقييمات خدماته)
        const providerRatings = location.services
          .map(s => s.average_rating)
          .filter(r => r > 0);
        const providerAvgRating = providerRatings.length > 0
          ? providerRatings.reduce((a, b) => a + b, 0) / providerRatings.length
          : 0;
        const totalReviews = location.services
          .reduce((sum, s) => sum + (s.reviews_count || 0), 0);
        
        content = `
          <style>
            @media (max-width: 1024px) {
              .info-window-main {
                width: 85vw !important;
                max-width: 85vw !important;
              }
            }
          </style>
          <div class="info-window-main" style="
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            width: calc(100vw - 400px);
            max-width: 1000px;
            padding: 0;
            direction: ${isRTL ? 'rtl' : 'ltr'};
            background: transparent;
            color: ${colors.text};
            box-sizing: border-box;
            position: relative;
          ">
            <!-- Close Button -->
            <button onclick="document.querySelector('.gm-style-iw').parentElement.style.display='none';" style="
              position: absolute;
              top: -8px;
              ${isRTL ? 'left: -8px;' : 'right: -8px;'}
              width: 28px;
              height: 28px;
              border-radius: 50%;
              background: rgba(255, 255, 255, 0.95);
              border: none;
              cursor: pointer;
              box-shadow: 0 2px 8px rgba(0,0,0,0.2);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
              font-weight: bold;
              color: #666;
              z-index: 1000;
            " onmouseover="this.style.background='rgba(255,255,255,1)'; this.style.color='#000';" onmouseout="this.style.background='rgba(255,255,255,0.95)'; this.style.color='#666';">
              ×
            </button>
            
            <!-- Floating Provider Header -->
            <div style="
              background: ${isDarkMode ? 'rgba(26, 29, 33, 0.92)' : 'rgba(255, 255, 255, 0.92)'};
              backdrop-filter: blur(12px);
              -webkit-backdrop-filter: blur(12px);
              padding: 12px 16px;
              border-radius: 16px;
              margin-bottom: 10px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.2);
              border: 1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
            ">
              <div style="
                font-size: 15px; 
                font-weight: 700; 
                margin-bottom: 4px;
                line-height: 1.3;
                color: ${colors.text};
              ">
                ${providerName}
              </div>
              ${location.provider_rating && location.provider_rating > 0 ? `
                <div style="
                  display: flex;
                  align-items: center;
                  gap: 4px;
                  margin-bottom: 6px;
                ">
                  <span style="color: ${colors.star}; font-size: 12px;">⭐</span>
                  <span style="font-size: 12px; font-weight: 600; color: ${colors.text};">
                    ${location.provider_rating.toFixed(1)}
                  </span>
                  <span style="font-size: 10px; color: ${colors.textSecondary};">
                    (${location.provider_reviews_count || 0} ${isRTL ? 'تقييم' : 'reviews'})
                  </span>
                </div>
              ` : ''}
              <div style="
                display: flex;
                align-items: center;
                gap: 8px;
                flex-wrap: wrap;
              ">
                <div style="
                  font-size: 11px;
                  color: ${colors.textSecondary};
                  display: flex;
                  align-items: center;
                  gap: 4px;
                ">
                  <span>📍</span>
                  <span>${isRTL ? `${servicesCount} خدمة` : `${servicesCount} services`}</span>
                </div>
              </div>
            </div>
            
            <!-- Horizontal Scrolling Services Cards -->
            <div 
              id="cards-container-${location.latitude}-${location.longitude}" 
              class="cards-container" 
              style="
                display: flex;
                gap: 10px;
                overflow-x: scroll;
                overflow-y: hidden;
                padding: 4px 0 12px 0;
                scrollbar-width: none;
                -ms-overflow-style: none;
                scroll-snap-type: x mandatory;
                -webkit-overflow-scrolling: touch;
                cursor: grab;
                touch-action: pan-x;
              "
              onmousedown="
                if (event.target.tagName === 'BUTTON') return;
                this.isDragging = true;
                this.startX = event.pageX;
                this.scrollLeftStart = this.scrollLeft;
                this.style.cursor = 'grabbing';
                this.style.scrollSnapType = 'none';
              "
              onmouseleave="
                this.isDragging = false;
                this.style.cursor = 'grab';
                this.style.scrollSnapType = 'x mandatory';
              "
              onmouseup="
                this.isDragging = false;
                this.style.cursor = 'grab';
                this.style.scrollSnapType = 'x mandatory';
              "
              onmousemove="
                if (!this.isDragging) return;
                event.preventDefault();
                const x = event.pageX;
                const distance = x - this.startX;
                this.scrollLeft = this.scrollLeftStart - distance;
              "
            >
            <style>
              .cards-container::-webkit-scrollbar {
                display: none;
              }
            </style>
              ${location.services.map((service, index) => {
                const rating = service.average_rating || 0;
                const reviewCount = service.reviews_count || 0;
                const isTopRated = rating >= 4.5;
                
                return `
                <div class="service-card" style="
                  min-width: 200px;
                  max-width: 200px;
                  background: ${isDarkMode ? 'rgba(36, 40, 48, 0.92)' : 'rgba(255, 255, 255, 0.92)'};
                  backdrop-filter: blur(12px);
                  -webkit-backdrop-filter: blur(12px);
                  padding: 12px;
                  border-radius: 16px;
                  cursor: default;
                  transition: all 0.3s ease;
                  border: 1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
                  box-shadow: 0 6px 20px rgba(0,0,0,0.15);
                  position: relative;
                  overflow: hidden;
                  scroll-snap-align: start;
                  flex-shrink: 0;
                  touch-action: pan-x;
                " 
                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.2)';"
                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.15)';">
                  
                  ${isTopRated ? `
                    <div style="
                      position: absolute;
                      top: 8px;
                      ${isRTL ? 'left: 8px;' : 'right: 8px;'}
                      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                      color: white;
                      font-size: 9px;
                      font-weight: 700;
                      padding: 3px 7px;
                      border-radius: 10px;
                      display: flex;
                      align-items: center;
                      gap: 2px;
                      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
                    ">
                      <span>⭐</span>
                      <span>${isRTL ? 'ممتاز' : 'TOP'}</span>
                    </div>
                  ` : ''}
                  
                  <!-- Service Name -->
                                    <!-- Service Name -->
                  <div style="
                    font-size: 13px;
                    font-weight: 700;
                    color: ${colors.text};
                    margin-bottom: 8px;
                    line-height: 1.3;
                    height: 2.6em;
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    padding-${isRTL ? 'left' : 'right'}: ${isTopRated ? '50px' : '0'};
                  ">
                    ${service.name}
                  </div>
                  
                  <!-- Rating & Reviews -->
                  ${rating > 0 ? `
                    <div style="
                      display: flex;
                      align-items: center;
                      gap: 4px;
                      margin-bottom: 10px;
                    ">
                      <div style="
                        color: ${colors.star};
                        font-size: 12px;
                        letter-spacing: 0.5px;
                        line-height: 1;
                      ">
                        ${renderStars(rating)}
                      </div>
                      <span style="
                        font-size: 12px;
                        font-weight: 600;
                        color: ${colors.text};
                      ">
                        ${rating.toFixed(1)}
                      </span>
                      <span style="
                        font-size: 10px;
                        color: ${colors.textSecondary};
                      ">
                        (${reviewCount})
                      </span>
                    </div>
                  ` : `
                    <div style="
                      font-size: 10px;
                      color: ${colors.textSecondary};
                      margin-bottom: 10px;
                      height: 16px;
                    ">
                      ⭐ ${isRTL ? 'لا توجد تقييمات' : 'No reviews'}
                    </div>
                  `}
                  
                  <!-- Price -->
                  <div style="
                    font-size: 18px;
                    color: #f59e0b;
                    font-weight: 700;
                    margin-bottom: 8px;
                  ">
                    ${service.price}${service.currency ? ` ${service.currency}` : ''}
                  </div>
                  
                  <!-- View Button -->
                  <button 
                    onclick="event.stopPropagation(); window.handleServiceClick?.('${service.id}');"
                    style="
                      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                      color: white;
                      font-size: 11px;
                      font-weight: 600;
                      padding: 7px 0;
                      border-radius: 8px;
                      text-align: center;
                      width: 100%;
                      border: none;
                      cursor: pointer;
                      transition: all 0.2s ease;
                      font-family: inherit;
                    "
                    onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 12px rgba(245, 158, 11, 0.4)';"
                    onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';"
                    ontouchstart="this.style.transform='scale(0.98)';"
                    ontouchend="this.style.transform='scale(1)';"
                  >
                    ${isRTL ? 'عرض التفاصيل' : 'View Details'}
                  </button>
                </div>
              `;
              }).join('')}
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
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="bg-card border-b p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary shrink-0" />
            <h3 className="text-xl sm:text-2xl font-semibold leading-none">{t.title}</h3>
          </div>
          <span className="hidden sm:inline text-muted-foreground">•</span>
          <p className="text-sm text-muted-foreground">{t.description}</p>
        </div>
        
        {showCurrentLocation && (
          <Button
            onClick={handleGetCurrentLocation}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto shrink-0"
          >
            <Navigation className="w-4 h-4 mr-2" />
            {t.getCurrentLocation}
          </Button>
        )}
      </div>
      
      {/* Map */}
      <div 
        ref={mapRef} 
        style={{ width: '100%', height: 'calc(100% - 73px)' }}
        className="overflow-hidden"
      />
    </div>
  );
};

export default InteractiveMap;
