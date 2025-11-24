import React from 'react';
import { cn } from "@/lib/utils";

interface StyledAdContainerProps {
  children: React.ReactNode;
  className?: string;
  label?: string;
  onClose?: () => void;
}

export const StyledAdContainer: React.FC<StyledAdContainerProps> = ({ 
  children, 
  className,
  label = "Sponsored",
  onClose
}) => {
  return (
    <div className={cn(
      "relative group overflow-hidden rounded-xl border border-primary/10 bg-card/50 backdrop-blur-sm shadow-sm transition-all hover:shadow-md hover:border-primary/20",
      className
    )}>
      {/* Decorative corner accents (luxury theme) */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary/30 rounded-tl-md" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary/30 rounded-tr-md" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-primary/30 rounded-bl-md" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary/30 rounded-br-md" />

      {/* Label */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-primary/5 px-3 py-0.5 rounded-b-md border-b border-x border-primary/10">
        <span className="text-[10px] uppercase tracking-widest text-primary/60 font-medium">
          {label}
        </span>
      </div>

      {/* Close button (optional) */}
      {onClose && (
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-1 right-1 p-1 rounded-full bg-background/80 hover:bg-destructive/10 hover:text-destructive transition-colors z-10 opacity-0 group-hover:opacity-100"
          aria-label="Close ad"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}

      {/* Content */}
      <div className="p-4 pt-6 flex items-center justify-center min-h-[100px]">
        {children}
      </div>
    </div>
  );
};
