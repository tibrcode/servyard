import React, { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { getCategoryIcon, getCategoryColor } from "@/lib/categoryIcons";

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
    category_id?: string;
    icon_name?: string;
    color_scheme?: string;
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
  const currentInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  
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
      streetViewControl: false,
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
  const addMarker = (location: Location, label?: string, draggable = false, isCurrentLocation = false) => {
    if (!mapInstanceRef.current) return;

    const isRTL = currentLanguage === 'ar';

    // إذا كان الموقع الحالي، استخدم أيقونة مخصصة نابضة
    let markerIcon = undefined;
    if (isCurrentLocation) {
      // إنشاء SVG لدائرة نابضة زرقاء مع موجات
      const pulsingDotSVG = `
        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <style>
              @keyframes pulse {
                0% { opacity: 1; transform: scale(0.3); }
                100% { opacity: 0; transform: scale(1); }
              }
              .pulse-ring {
                animation: pulse 2s ease-out infinite;
                transform-origin: center;
              }
            </style>
          </defs>
          <!-- Pulsing rings -->
          <circle class="pulse-ring" cx="20" cy="20" r="15" fill="none" stroke="#2563eb" stroke-width="2" opacity="0"/>
          <circle class="pulse-ring" cx="20" cy="20" r="15" fill="none" stroke="#2563eb" stroke-width="2" opacity="0" style="animation-delay: 0.5s"/>
          <circle class="pulse-ring" cx="20" cy="20" r="15" fill="none" stroke="#2563eb" stroke-width="2" opacity="0" style="animation-delay: 1s"/>
          <!-- Outer glow -->
          <circle cx="20" cy="20" r="10" fill="#3b82f6" opacity="0.3"/>
          <!-- Main dot -->
          <circle cx="20" cy="20" r="6" fill="#2563eb"/>
          <!-- Center highlight -->
          <circle cx="20" cy="20" r="3" fill="#60a5fa"/>
        </svg>
      `;
      
      markerIcon = {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(pulsingDotSVG),
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 20)
      };
    }

    // استخدام Marker العادي (AdvancedMarker يحتاج Map ID من Google Console)
    const marker = new google.maps.Marker({
      position: { lat: location.latitude, lng: location.longitude },
      map: mapInstanceRef.current,
      title: label || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
      draggable: draggable,
      animation: google.maps.Animation.DROP,
      icon: markerIcon
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
            .gm-style-iw-d {
              background: transparent !important;
              box-shadow: none !important;
              overflow: visible !important;
              backdrop-filter: none !important;
              -webkit-backdrop-filter: none !important;
            }
            .gm-style-iw-c {
              background: transparent !important;
              box-shadow: none !important;
              padding: 0 !important;
              backdrop-filter: none !important;
              -webkit-backdrop-filter: none !important;
            }
            .gm-style-iw {
              background: transparent !important;
              backdrop-filter: none !important;
              -webkit-backdrop-filter: none !important;
            }
            .gm-style .gm-style-iw-c {
              background: transparent !important;
              backdrop-filter: none !important;
              -webkit-backdrop-filter: none !important;
            }
            .gm-style .gm-style-iw-d {
              background: transparent !important;
              backdrop-filter: none !important;
              -webkit-backdrop-filter: none !important;
            }
            .gm-style-iw-tc {
              display: none !important;
            }
            .gm-style-iw-tc::after {
              display: none !important;
            }
            div[role="dialog"] {
              background: transparent !important;
              backdrop-filter: none !important;
              -webkit-backdrop-filter: none !important;
            }
            .gm-style > div > div {
              background: transparent !important;
              backdrop-filter: none !important;
              -webkit-backdrop-filter: none !important;
            }
            .info-window-main {
              backdrop-filter: none !important;
              -webkit-backdrop-filter: none !important;
            }
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
            <!-- Floating Provider Header -->
            <div style="
              background: ${isDarkMode ? 'rgba(28, 28, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
              backdrop-filter: blur(16px);
              -webkit-backdrop-filter: blur(16px);
              padding: 12px 16px;
              border-radius: 16px;
              margin-bottom: 10px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.2);
              border: 1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
              position: relative;
            ">
              <!-- Close Button Inside Card -->
              <button onclick="document.querySelector('.gm-style-iw').parentElement.style.display='none';" style="
                position: absolute;
                top: 8px;
                ${isRTL ? 'left: 8px;' : 'right: 8px;'}
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                font-weight: bold;
                color: ${isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.4)'};
                transition: all 0.2s ease;
              " onmouseover="this.style.background='${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}'; this.style.color='${isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.7)'}';" onmouseout="this.style.background='${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}'; this.style.color='${isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.4)'}';">
                ×
              </button>
              
              <div style="
                font-size: 15px; 
                font-weight: 700; 
                margin-bottom: 6px;
                line-height: 1.3;
                color: ${colors.text};
                padding-${isRTL ? 'left' : 'right'}: 32px;
              ">
                ${providerName}
              </div>
              <div style="
                display: flex;
                align-items: center;
                gap: 8px;
                flex-wrap: wrap;
              ">
                ${location.provider_rating && location.provider_rating > 0 ? `
                  <div style="
                    display: flex;
                    align-items: center;
                    gap: 4px;
                  ">
                    <span style="color: ${colors.star}; font-size: 12px;">⭐</span>
                    <span style="font-size: 12px; font-weight: 600; color: ${colors.text};">
                      ${location.provider_rating.toFixed(1)}
                    </span>
                    <span style="font-size: 10px; color: ${colors.textSecondary};">
                      (${location.provider_reviews_count || 0})
                    </span>
                  </div>
                  <span style="color: ${colors.textSecondary}; font-size: 11px;">•</span>
                ` : ''}
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
                
                // Debug: طباعة بيانات الخدمة
                console.log('Service data:', { name: service.name, icon_name: service.icon_name, color_scheme: service.color_scheme });
                
                // الحصول على تفاصيل الفئة للأيقونة
                let categoryIcon = '';
                let categoryBgColor = '#f3f4f6';
                let categoryTextColor = '#4b5563';
                if (service.icon_name && service.color_scheme) {
                  const colors = getCategoryColor(service.color_scheme);
                  // تحويل اسم الكلاس إلى قيمة اللون
                  const colorMap: { [key: string]: { bg: string; text: string } } = {
                    'blue': { bg: '#dbeafe', text: '#0369a1' },
                    'orange': { bg: '#fed7aa', text: '#b45309' },
                    'red': { bg: '#fecaca', text: '#b91c1c' },
                    'green': { bg: '#dcfce7', text: '#166534' },
                    'pink': { bg: '#fbcfe8', text: '#be185d' },
                    'purple': { bg: '#e9d5ff', text: '#6b21a8' },
                    'yellow': { bg: '#fef3c7', text: '#92400e' },
                    'indigo': { bg: '#e0e7ff', text: '#4338ca' },
                    'teal': { bg: '#ccfbf1', text: '#115e59' },
                    'cyan': { bg: '#cffafe', text: '#0e7490' },
                    'lime': { bg: '#ecfccb', text: '#3f6212' },
                    'emerald': { bg: '#d1fae5', text: '#065f46' },
                    'sky': { bg: '#e0f2fe', text: '#0369a1' },
                    'violet': { bg: '#ddd6fe', text: '#5b21b6' },
                    'fuchsia': { bg: '#f5d0fe', text: '#a21caf' },
                    'rose': { bg: '#ffe4e6', text: '#be123c' },
                    'amber': { bg: '#fef3c7', text: '#b45309' },
                    'slate': { bg: '#f1f5f9', text: '#475569' },
                    'gray': { bg: '#f3f4f6', text: '#4b5563' }
                  };
                  
                  const colorKey = service.color_scheme.toLowerCase();
                  const colorValues = colorMap[colorKey] || { bg: '#f3f4f6', text: '#4b5563' };
                  categoryBgColor = colorValues.bg;
                  categoryTextColor = colorValues.text;
                  
                  // خريطة الأيقونات SVG
                  const iconSvgMap: { [key: string]: string } = {
                    'sparkles': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>',
                    'wrench': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
                    'heart': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
                    'home': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
                    'shopping-bag': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
                    'book': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>',
                    'users': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
                    'camera': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>',
                    'truck': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>',
                    'phone': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
                    'scissors': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/></svg>',
                    'paint-bucket': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z"/><path d="m5 2 5 5"/><path d="M2 13h15"/><path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z"/></svg>',
                    'car': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>',
                    'utensils': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>',
                    'zap': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
                    'leaf': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>',
                    'briefcase': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
                    'graduation-cap': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
                    'music': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
                    'dumbbell': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>',
                    'gift': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/></svg>',
                  };
                  categoryIcon = iconSvgMap[service.icon_name] || '';
                }
                
                return `
                <div class="service-card" style="
                  min-width: 200px;
                  max-width: 200px;
                  background: ${isDarkMode ? 'rgba(28, 28, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
                  backdrop-filter: blur(16px);
                  -webkit-backdrop-filter: blur(16px);
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
                  
                  
                  <!-- Service Name with Icon -->
                  <div style="
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    margin-bottom: 8px;
                  ">
                    <div style="
                      background: ${categoryBgColor};
                      padding: 8px;
                      border-radius: 8px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      flex-shrink: 0;
                      color: ${categoryTextColor};
                      width: 36px;
                      height: 36px;
                    ">
                      ${categoryIcon || '⚙️'}
                    </div>
                    <div style="
                      font-size: 13px;
                      font-weight: 700;
                      color: ${colors.text};
                      line-height: 1.3;
                      height: 2.6em;
                      overflow: hidden;
                      display: -webkit-box;
                      -webkit-line-clamp: 2;
                      -webkit-box-orient: vertical;
                      flex: 1;
                      padding-${isRTL ? 'left' : 'right'}: ${isTopRated ? '50px' : '0'};
                    ">
                      ${service.name}
                    </div>
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
        content: content,
        disableAutoPan: false
      });
      
      // إزالة الخلفية بعد فتح InfoWindow
      google.maps.event.addListener(infoWindow, 'domready', () => {
        // استخدام setTimeout للتأكد من تحميل جميع العناصر
        setTimeout(() => {
          // البحث عن جميع عناصر InfoWindow
          const iwContainer = document.querySelector('.gm-style-iw-c');
          const iwContent = document.querySelector('.gm-style-iw-d');
          const iwOuter = document.querySelector('.gm-style-iw');
          
          // إخفاء عنصر الخلفية والسهم
          const iwBackground = document.querySelector('.gm-style-iw + div');
          if (iwBackground) {
            (iwBackground as HTMLElement).style.display = 'none';
          }
          
          // إزالة جميع الخلفيات
          [iwContainer, iwContent, iwOuter].forEach(el => {
            if (el) {
              const htmlEl = el as HTMLElement;
              htmlEl.style.setProperty('background', 'transparent', 'important');
              htmlEl.style.setProperty('background-color', 'transparent', 'important');
              htmlEl.style.setProperty('box-shadow', 'none', 'important');
            }
          });
          
          // البحث عن كل div داخل gm-style وإزالة خلفيته
          const gmStyleDivs = document.querySelectorAll('.gm-style div');
          gmStyleDivs.forEach(el => {
            const htmlEl = el as HTMLElement;
            const bgColor = window.getComputedStyle(htmlEl).backgroundColor;
            
            // إذا كان له خلفية غير شفافة
            if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
              // تحقق إذا لم يكن من البطاقات الداخلية
              if (!htmlEl.classList.contains('service-card') && 
                  !htmlEl.closest('.service-card') &&
                  !htmlEl.closest('[style*="background: rgba(28"]') &&
                  !htmlEl.closest('[style*="background: rgba(255"]')) {
                htmlEl.style.setProperty('background', 'transparent', 'important');
                htmlEl.style.setProperty('background-color', 'transparent', 'important');
              }
            }
          });
        }, 50);
      });
      
      // تفعيل callback للخدمات
      if (onServiceClick) {
        (window as any).handleServiceClick = (serviceId: string) => {
          onServiceClick(serviceId);
          infoWindow.close();
        };
      }
      
      marker.addListener('click', () => {
        // إغلاق InfoWindow السابق إذا كان مفتوحاً
        if (currentInfoWindowRef.current) {
          currentInfoWindowRef.current.close();
        }
        
        // فتح InfoWindow الجديد وحفظ المرجع
        infoWindow.open(mapInstanceRef.current!, marker);
        currentInfoWindowRef.current = infoWindow;
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
        addMarker(location, t.getCurrentLocation, true, true);
        
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
