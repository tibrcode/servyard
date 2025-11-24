import React, { useState, useEffect } from "react";
import { StyledAdContainer } from "./StyledAdContainer";
import { GoogleAdUnit } from "./GoogleAdUnit";

interface AdBannerProps {
  type: "mobile" | "sidebar";
  position?: "top" | "bottom";
  className?: string;
  slotId?: string; // Optional: allow passing specific slot IDs
}

export const AdBanner = ({ type, position = "bottom", className = "", slotId = "1234567890" }: AdBannerProps) => {
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
    `fixed ${position === 'bottom' ? 'bottom-0' : 'top-0'} left-0 right-0 z-50 p-2 bg-background/80 backdrop-blur-md border-t border-border shadow-lg` : 
    "";
  
  const sidebarStyles = type === "sidebar" ? 
    "sticky top-20 mb-6" : 
    "";

  return (
    <div className={`${mobileStyles} ${sidebarStyles} ${className}`}>
      <StyledAdContainer 
        onClose={() => setIsVisible(false)}
        className={type === "mobile" ? "h-auto min-h-[60px] border-none shadow-none bg-transparent" : "min-h-[280px]"}
        label={type === "mobile" ? "Ad" : "Sponsored"}
      >
        {/* 
           In a real scenario, you would use the GoogleAdUnit component.
           For now, we show a placeholder if the slotId is the default dummy one.
           Once you have real AdSense slots, replace the condition or remove the placeholder.
        */}
        {slotId === "1234567890" ? (
           <div className={`
            flex flex-col items-center justify-center text-center
            text-muted-foreground/50
            ${type === "mobile" ? "w-full h-12" : "w-full h-full p-8"}
          `}>
            <span className="text-xs font-medium uppercase tracking-widest mb-1">Google Ads</span>
            <span className="text-[10px] opacity-70">
              {type === "mobile" ? "Responsive Banner" : "Sidebar Rectangle"}
            </span>
          </div>
        ) : (
          <GoogleAdUnit 
            slot={slotId} 
            format={type === "mobile" ? "horizontal" : "rectangle"}
            style={{ display: 'block', width: '100%' }}
          />
        )}
      </StyledAdContainer>
    </div>
  );
};