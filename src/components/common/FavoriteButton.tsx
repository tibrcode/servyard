// Favorite Button Component
// مكون زر المفضلة

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toggleFavorite, isFavorite } from '@/lib/firebase/favoriteFunctions';
import { FavoriteType } from '@/types/favorites';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  type: FavoriteType;
  itemId: string;
  itemData?: {
    title?: string;
    image?: string;
    category?: string;
    rating?: number;
    location?: string;
  };
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
}

export function FavoriteButton({
  type,
  itemId,
  itemData,
  variant = 'ghost',
  size = 'icon',
  className,
  showLabel = false,
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFav, setIsFav] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const isRTL = true; // Get from context

  const t = {
    addedToFavorites: isRTL ? 'تمت الإضافة إلى المفضلة' : 'Added to favorites',
    removedFromFavorites: isRTL ? 'تمت الإزالة من المفضلة' : 'Removed from favorites',
    loginRequired: isRTL ? 'يرجى تسجيل الدخول' : 'Please log in',
    loginRequiredDesc: isRTL ? 'يجب تسجيل الدخول لإضافة عناصر إلى المفضلة' : 'You must be logged in to add favorites',
    addToFavorites: isRTL ? 'إضافة للمفضلة' : 'Add to favorites',
    removeFromFavorites: isRTL ? 'إزالة من المفضلة' : 'Remove from favorites',
  };

  // Check if already favorite
  useEffect(() => {
    const checkFavorite = async () => {
      if (!user?.uid) {
        setIsChecking(false);
        return;
      }

      setIsChecking(true);
      const favoriteId = await isFavorite(user.uid, itemId);
      setIsFav(!!favoriteId);
      setIsChecking(false);
    };

    checkFavorite();
  }, [user?.uid, itemId]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast({
        title: t.loginRequired,
        description: t.loginRequiredDesc,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const added = await toggleFavorite(user.uid, type, itemId, itemData);

      setIsFav(added);

      toast({
        title: added ? t.addedToFavorites : t.removedFromFavorites,
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <Button
        variant={variant}
        size={size}
        className={cn('relative', className)}
        disabled
      >
        <div className="h-4 w-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
        {showLabel && <span className="mr-2">{t.addToFavorites}</span>}
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={cn('relative transition-all', className)}
      onClick={handleClick}
      disabled={isLoading}
      title={isFav ? t.removeFromFavorites : t.addToFavorites}
    >
      {isLoading ? (
        <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <Heart
          className={cn(
            'h-4 w-4 transition-all',
            isFav && 'fill-red-500 text-red-500 scale-110'
          )}
        />
      )}
      {showLabel && (
        <span className="mr-2">
          {isFav ? t.removeFromFavorites : t.addToFavorites}
        </span>
      )}
    </Button>
  );
}
