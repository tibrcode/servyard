import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { getCategoryIcon, colorMap } from "@/lib/categoryIcons";

interface ProviderLogoProps {
  providerName: string;
  avatarUrl?: string;
  verified?: boolean;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
  categoryIconName?: string;
  categoryColorScheme?: string;
}

export const ProviderLogo = ({
  providerName,
  avatarUrl,
  verified = false,
  size = "md",
  showName = true,
  className,
  categoryIconName,
  categoryColorScheme
}: ProviderLogoProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const CategoryIcon = categoryIconName ? getCategoryIcon(categoryIconName) : null;
  const colorStyles = categoryColorScheme && colorMap[categoryColorScheme] 
    ? colorMap[categoryColorScheme] 
    : { bg: "bg-primary/10", text: "text-primary" };

  return (
    <div className={cn("flex items-center gap-3 min-w-0", className)}>
      <div className="relative flex-shrink-0">
        <Avatar className={cn(sizeClasses[size], "flex items-center justify-center", CategoryIcon ? colorStyles.bg : "bg-primary/10")}>
          {CategoryIcon ? (
            <CategoryIcon className={cn(iconSizes[size], colorStyles.text)} />
          ) : avatarUrl ? (
            <LazyLoadImage
              src={avatarUrl}
              alt={providerName}
              effect="blur"
              className="object-cover w-full h-full rounded-full"
            />
          ) : (
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {getInitials(providerName)}
            </AvatarFallback>
          )}
        </Avatar>
        {verified && (
          <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 rounded-full ring-2 ring-background">
            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 bg-white rounded-full" />
          </div>
        )}
      </div>

      {showName && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn(
              "font-semibold provider-name whitespace-normal leading-snug truncate max-w-[12rem] sm:max-w-[20rem]",
              size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : "text-base"
            )}>
              {providerName}
            </span>
            {/* Avoid extra text badge on tight layouts to reduce crowding */}
          </div>
        </div>
      )}
    </div>
  );
};