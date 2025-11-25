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
import { useTranslation } from '@/lib/i18n';

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
  language?: string;
}

export function FavoriteButton({
  type,
  itemId,
  itemData,
  variant = 'ghost',
  size = 'icon',
  className,
  showLabel = false,
  language = 'ar',
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation(language as 'ar' | 'en');
  const [isFav, setIsFav] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

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
        title: t.favoriteButton?.loginRequired || 'Please log in',
        description: t.favoriteButton?.loginRequiredDesc || 'You must be logged in to add favorites',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const added = await toggleFavorite(user.uid, type, itemId, itemData);

      setIsFav(added);

      toast({
        title: added 
          ? (t.favoriteButton?.addedToFavorites || 'Added to favorites')
          : (t.favoriteButton?.removedFromFavorites || 'Removed from favorites'),
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
        {showLabel && <span className="mr-2">{t.favoriteButton?.addToFavorites || 'Add to favorites'}</span>}
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={cn('relative transition-all [&_svg]:size-6', className)}
      onClick={handleClick}
      disabled={isLoading}
      title={isFav 
        ? (t.favoriteButton?.removeFromFavorites || 'Remove from favorites')
        : (t.favoriteButton?.addToFavorites || 'Add to favorites')}
    >
      {isLoading ? (
        <div className="h-6 w-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <Heart
          className={cn(
            'h-6 w-6 transition-all',
            isFav && 'fill-red-500 text-red-500 scale-110'
          )}
        />
      )}
      {showLabel && (
        <span className="mr-2">
          {isFav 
            ? (t.favoriteButton?.removeFromFavorites || 'Remove from favorites')
            : (t.favoriteButton?.addToFavorites || 'Add to favorites')}
        </span>
      )}
    </Button>
  );
}
