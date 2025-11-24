import React, { useEffect, useRef } from 'react';

interface GoogleAdUnitProps {
  client?: string;
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  responsive?: boolean;
  layoutKey?: string;
  style?: React.CSSProperties;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export const GoogleAdUnit: React.FC<GoogleAdUnitProps> = ({
  client = 'ca-pub-4410866538083227', // Updated with user's Publisher ID
  slot,
  format = 'auto',
  responsive = true,
  layoutKey,
  style,
  className = ''
}) => {
  const adRef = useRef<HTMLModElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    // Prevent double initialization in React Strict Mode
    if (initialized.current) return;
    
    try {
      const adsbygoogle = window.adsbygoogle || [];
      // Only push if the ad hasn't been filled yet (checking child nodes is a rough heuristic)
      if (adRef.current && adRef.current.innerHTML === '') {
        adsbygoogle.push({});
        initialized.current = true;
      }
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, []);

  return (
    <div className={`ad-container overflow-hidden ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
        data-ad-layout-key={layoutKey}
      />
    </div>
  );
};
