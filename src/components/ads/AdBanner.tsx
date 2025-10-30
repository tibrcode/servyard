import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface AdBannerProps {
  type: "mobile" | "sidebar";
  position?: "top" | "bottom";
  className?: string;
}

export const AdBanner = ({ type, position = "bottom", className = "" }: AdBannerProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Only show mobile banner on mobile devices and sidebar banner on desktop
  if ((type === "mobile" && !isMobile) || (type === "sidebar" && isMobile)) {
    return null;
  }

  if (!isVisible) {
    return null;
  }

  const mobileStyles = type === "mobile" ? 
    `fixed ${position === 'bottom' ? 'bottom-0' : 'top-0'} left-0 right-0 z-50 bg-background border-t border-border` : 
    "";
  
  const sidebarStyles = type === "sidebar" ? 
    "sticky top-4 bg-muted border border-border rounded-lg" : 
    "";

  return (
    <div className={`${mobileStyles} ${sidebarStyles} ${className}`}>
      <div className={`relative ${type === "mobile" ? "h-16 flex items-center justify-center px-4" : "h-64 p-4"}`}>
        {/* Close button */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-background/80 transition-colors"
          aria-label="Close ad"
        >
          <X className="h-3 w-3" />
        </button>

        {/* Ad content placeholder */}
        <div className={`
          bg-gradient-to-r from-primary/10 to-primary/5 
          border border-primary/20 rounded-md
          flex items-center justify-center
          text-sm text-muted-foreground
          ${type === "mobile" ? "w-full h-12" : "w-full h-full"}
        `}>
          {type === "mobile" ? (
            <span>Advertisement Space • 320x50</span>
          ) : (
            <div className="text-center">
              <div>Advertisement Space</div>
              <div className="text-xs mt-1">300x250</div>
            </div>
          )}
        </div>

        {/* AdSense integration placeholder */}
        {process.env.NODE_ENV === 'production' && (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Replace with actual AdSense code */}
            <ins className="adsbygoogle"
                 style={{ display: 'inline-block', width: type === "mobile" ? '320px' : '300px', height: type === "mobile" ? '50px' : '250px' }}
                 data-ad-client="ca-pub-xxxxxxxxxx"
                 data-ad-slot="xxxxxxxxxx">
            </ins>
          </div>
        )}
      </div>
    </div>
  );
};