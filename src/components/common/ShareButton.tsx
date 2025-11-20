import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
}

export function ShareButton({
  title,
  text,
  url,
  variant = 'ghost',
  size = 'icon',
  className,
  showLabel = false,
}: ShareButtonProps) {
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);

  const isRTL = document.documentElement.dir === 'rtl';

  const t = {
    share: isRTL ? 'مشاركة' : 'Share',
    shareSuccess: isRTL ? 'تم نسخ الرابط' : 'Link copied',
    shareSuccessDesc: isRTL ? 'تم نسخ رابط الخدمة إلى الحافظة' : 'Service link copied to clipboard',
    shareError: isRTL ? 'حدث خطأ' : 'Error',
    shareErrorDesc: isRTL ? 'لم نتمكن من مشاركة الرابط' : 'Could not share link',
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    setIsSharing(true);
    
    // Use provided URL or current page URL
    const shareUrl = url || window.location.href;
    
    const shareData = {
      title: title,
      text: text,
      url: shareUrl,
    };

    try {
      // Try native share first (works on mobile)
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard copy
        await navigator.clipboard.writeText(`${title}\n${text}\n${shareUrl}`);
        toast({
          title: t.shareSuccess,
          description: t.shareSuccessDesc,
        });
      }
    } catch (error) {
      // Ignore AbortError (user cancelled share)
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error);
        toast({
          variant: "destructive",
          title: t.shareError,
          description: t.shareErrorDesc,
        });
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "transition-colors hover:text-blue-500 hover:bg-blue-50 [&_svg]:size-6",
        className
      )}
      onClick={handleShare}
      disabled={isSharing}
      title={t.share}
    >
      <Share2 className={cn("h-6 w-6", showLabel && (isRTL ? "ml-2" : "mr-2"))} />
      {showLabel && <span>{t.share}</span>}
    </Button>
  );
}
