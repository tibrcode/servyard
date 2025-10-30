import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2, QrCode, Copy, Check } from "lucide-react";
import QRCode from "qrcode";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";

interface ShareProfileProps {
  providerId: string;
  providerName: string;
  currentLanguage: string;
}

export const ShareProfile = ({ providerId, providerName, currentLanguage }: ShareProfileProps) => {
  const { t } = useTranslation(currentLanguage);
  const [profileUrl, setProfileUrl] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const url = `${window.location.origin}/provider/${providerId}`;
    setProfileUrl(url);

    // Generate QR Code
    QRCode.toDataURL(url, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    }).then(dataUrl => {
      setQrCodeDataUrl(dataUrl);
    }).catch(err => {
      console.error('Error generating QR code:', err);
    });
  }, [providerId]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast({
        title: t.provider.linkCopied,
        description: t.shareProfile.shareWithClients,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({
        title: t.toast.error,
        description: t.provider.copyLink,
        variant: "destructive",
      });
    }
  };

  const handleDownloadQR = () => {
    if (qrCodeDataUrl) {
      const link = document.createElement('a');
      link.download = `${providerName}-qr-code.png`;
      link.href = qrCodeDataUrl;
      link.click();
      toast({
        title: t.shareProfile.downloadQRCode,
        description: t.shareProfile.qrCodeDescription,
      });
    }
  };

  return (
    <div className="w-full max-w-full min-w-0 space-y-6">
      {/* Profile Link */}
      <div className="space-y-3">
        <Label htmlFor="profile-url" className="text-sm font-medium leading-relaxed break-words">
          {t.shareProfile.profileLink}
        </Label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            id="profile-url"
            value={profileUrl}
            readOnly
            className="flex-1 min-w-0 break-all"
          />
          <Button
            onClick={handleCopyLink}
            variant="outline"
            size="sm"
            className={`flex items-center gap-2 whitespace-normal break-words leading-tight w-full sm:w-auto ${copied ? "bg-green-100 text-green-800" : ""}`}
          >
            {copied ? <Check className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" /> : <Copy className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />}
            <span className="break-words text-xs sm:text-sm">{copied ? t.provider.linkCopied : (t.provider.copyLink)}</span>
          </Button>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words hyphens-auto">
          {t.shareProfile.shareWithClients}
        </p>
      </div>

      {/* QR Code */}
      <div className="space-y-4">
        <Label className="text-sm font-medium leading-relaxed break-words">
          {t.shareProfile.qrCode}
        </Label>
        <div className="flex flex-col items-center space-y-4">
          {qrCodeDataUrl && (
            <div className="p-4 bg-white rounded-lg border">
              <img
                src={qrCodeDataUrl}
                alt={t.shareProfile.qrCode}
                className="w-48 h-48"
              />
            </div>
          )}
          <Button
            onClick={handleDownloadQR}
            variant="outline"
            className="w-full max-w-xs flex items-center gap-2 whitespace-normal break-words leading-tight"
            disabled={!qrCodeDataUrl}
          >
            <QrCode className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="break-words text-xs sm:text-sm">{t.shareProfile.downloadQRCode}</span>
          </Button>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground text-center leading-relaxed break-words hyphens-auto">
          {t.shareProfile.qrCodeDescription}
        </p>
      </div>
    </div>
  );
};