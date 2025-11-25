import React, { useState, useEffect } from "react";
import { StyledAdContainer } from "./StyledAdContainer";
import { GoogleAdUnit } from "./GoogleAdUnit";

interface AdBannerProps {
  type: "mobile" | "sidebar" | "sticky-footer";
  position?: "top" | "bottom";
  className?: string;
  slotId?: string;
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

  // Handle body padding for sticky footer to prevent content overlap
  useEffect(() => {
    if (type === "sticky-footer" && isVisible) {
      // Add padding to body equal to ad height only (no margins now)
      // Mobile: 50px ad height
      // Desktop: 90px ad height
      const padding = isMobile ? "50px" : "90px";
      document.body.style.paddingBottom = padding;
      return () => {
        document.body.style.paddingBottom = "";
      };
    }
  }, [type, isVisible, isMobile]);

  // Logic for showing/hiding based on type and device
  if (type === "mobile" && !isMobile) return null;
  if (type === "sidebar" && isMobile) return null;
  // sticky-footer shows on ALL devices

  if (!isVisible) {
    return null;
  }

  // Styles for the new Sticky Footer (Floating Card)
  if (type === "sticky-footer") {
    return (
      <div className={`fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none ${className}`}>
        <div className="w-full max-w-4xl pointer-events-auto shadow-2xl drop-shadow-2xl">
          <StyledAdContainer 
            // No onClose prop = No close button
            className="bg-background/95 backdrop-blur-xl border-t border-x border-primary/20 rounded-t-xl md:rounded-t-2xl shadow-lg overflow-hidden"
            label="Sponsored"
          >
            {slotId === "1234567890" ? (
              <div className="flex flex-col items-center justify-center text-center py-2 md:py-3">
                <span className="text-[10px] md:text-xs font-medium uppercase tracking-widest mb-0.5 text-primary">
                  Premium Ad Space
                </span>
                <span className="text-[9px] md:text-[10px] text-muted-foreground">
                  {isMobile ? "Mobile Footer (50px)" : "Desktop Footer (90px)"}
                </span>
              </div>
            ) : (
              <GoogleAdUnit 
                slot={slotId} 
                format="horizontal"
                style={{ 
                  display: 'block', 
                  width: '100%', 
                  height: isMobile ? '50px' : '90px',
                  maxHeight: isMobile ? '50px' : '90px' 
                }}
              />
            )}
          </StyledAdContainer>
        </div>
      </div>
    );
  }

  // Legacy styles for other types (if still used)
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