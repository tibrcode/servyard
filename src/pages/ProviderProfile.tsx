import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Star,
  Phone,
  Mail,
  MapPin,
  Clock,
  Calendar,
  Shield,
  Award,
  MessageCircle,
  Share2,
  Heart,
  ExternalLink,
  CheckCircle,
  Globe,
  Instagram,
  Facebook,
  Music2
} from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";
import { BookingModal } from "@/components/booking/BookingModal";
import { auth } from "@/integrations/firebase/client";
import { useTranslation } from "@/lib/i18n";
import { FavoriteButton } from "@/components/common/FavoriteButton";
import { iconMap, colorMap } from "@/lib/categoryIcons";
import { useProviderData } from "@/hooks/useProviderData";
import { Service, ProviderProfile as ProviderProfileType } from "@/types/service";

interface ProviderProfileProps {
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
}

const ProviderProfile = ({ currentLanguage, onLanguageChange }: ProviderProfileProps) => {
  const { providerId } = useParams<{ providerId: string }>();
  const { t, isRTL } = useTranslation(currentLanguage);
  const { toast } = useToast();

  const { profile, services, offers, reviews, mainCategory, isLoading } = useProviderData(providerId);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Calculate rating
  const displayProfile = useMemo(() => {
    if (!profile) return null;
    
    if (!reviews.length) return profile;
    
    const ratings = reviews
      .filter(r => r.is_approved !== false && typeof r.rating === 'number')
      .map(r => r.rating);
    const total = ratings.length;
    const avg = total > 0 ? ratings.reduce((a, b) => a + b, 0) / total : undefined;
    
    return { ...profile, rating: avg, total_reviews: total };
  }, [profile, reviews]);

  // Normalize URLs to ensure they have protocol
  const normalizeUrl = (url: string) => {
    if (!url) return url;
    return /^https?:\/\//i.test(url) ? url : `https://${url}`;
  };

  // Share current provider profile link using Web Share API with clipboard fallback
  const handleShare = async () => {
    const shareUrl = window.location.href;
    const title = displayProfile?.full_name || 'ServYard';
    try {
      if ('share' in navigator) {
        await (navigator as any).share({ title, text: title, url: shareUrl });
        return;
      }
    } catch (err) {
      // If user cancels native share, silently ignore and do not copy
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const ta = document.createElement('textarea');
        ta.value = shareUrl;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      toast({ title: t.provider.linkCopied });
    } catch (copyErr) {
      console.warn('Share/copy failed', copyErr);
    }
  };

  const handleBookService = (service: Service) => {
    setSelectedService(service);
    setShowBookingModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!displayProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{isRTL ? 'لم يتم العثور على مقدم الخدمة' : 'Provider not found'}</h2>
          <Button onClick={() => window.history.back()}>{isRTL ? 'عودة' : 'Go Back'}</Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <h1 className="text-2xl font-bold mb-4">{t.ui.providerNotFound}</h1>
        <p className="text-muted-foreground">{t.ui.errorLoadingData}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <main className="flex-1 overflow-x-hidden">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary/10 to-primary-glow/10 py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row gap-8 items-start min-w-0">
                {/* Provider Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-4 mb-6">
                    {mainCategory && iconMap[mainCategory.icon] ? (
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center shrink-0 ${colorMap[mainCategory.color]?.bg || 'bg-primary/10'}`}>
                        {(() => {
                          const IconComponent = iconMap[mainCategory.icon];
                          return <IconComponent className={`w-10 h-10 ${colorMap[mainCategory.color]?.text || 'text-primary'}`} />;
                        })()}
                      </div>
                    ) : (
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                        <AvatarFallback className="text-2xl">
                          {profile.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 min-w-0">
                        <h1 className="text-2xl md:text-3xl font-bold leading-tight break-words whitespace-normal max-w-full flex-1 min-w-0">{profile.full_name}</h1>
                        {profile.is_verified && (
                          <Badge className="bg-green-100 text-green-800 shrink-0">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {t.ui.verified}
                          </Badge>
                        )}
                        <FavoriteButton
                          type="provider"
                          itemId={profile.user_id}
                          itemData={{
                            title: profile.full_name,
                            image: profile.avatar_url,
                            rating: profile.rating,
                            location: `${profile.city}, ${profile.country}`
                          }}
                          variant="ghost"
                          size="sm"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-muted-foreground mb-3 min-w-0">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{profile.city}, {profile.country}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${profile.is_online ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <span className="text-sm whitespace-nowrap">
                            {profile.is_online ? t.userInterface.onlineNow : t.userInterface.offline}
                          </span>
                        </div>
                        {profile.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span>{profile.rating.toFixed(1)}</span>
                            <span>({profile.total_reviews || 0} {t.customer.reviews})</span>
                          </div>
                        )}
                      </div>

                      <p className="text-lg leading-relaxed break-words">
                        {profile.profile_description}
                      </p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="flex gap-4 flex-wrap min-w-0">
                    {profile.phone_numbers && profile.phone_numbers.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`tel:${profile.phone_numbers[0]}`, '_self')}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        {t.customer.call}
                      </Button>
                    )}
                    {profile.whatsapp_number && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`https://wa.me/${profile.whatsapp_number.replace(/\D/g, '')}`, '_blank')}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        {t.customer.whatsapp}
                      </Button>
                    )}
                    {profile.email && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const subject = encodeURIComponent(`${t.actions.contact || 'Contact'} - ${profile.full_name}`);
                          // Use location to better support mobile WebViews
                          window.location.href = `mailto:${profile.email}?subject=${subject}`;
                        }}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        {t.forms.email || t.auth.email}
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={handleShare}>
                      <Share2 className="w-4 h-4 mr-2" />
                      {t.actions.share}
                    </Button>
                    {profile.website_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(normalizeUrl(profile.website_url!), '_blank', 'noopener')}
                      >
                        <Globe className="w-4 h-4 mr-2" />
                        {t.actions.websiteLabel || t.forms.website}
                      </Button>
                    )}
                    {profile.google_business_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => (window.location.href = normalizeUrl(profile.google_business_url!))}
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        {t.actions.locationLabel || t.nav.location}
                      </Button>
                    )}
                    {profile.instagram_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(normalizeUrl(profile.instagram_url!), '_blank', 'noopener')}
                      >
                        <Instagram className="w-4 h-4 mr-2" />
                        {t.actions.instagram}
                      </Button>
                    )}
                    {profile.facebook_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(normalizeUrl(profile.facebook_url!), '_blank', 'noopener')}
                      >
                        <Facebook className="w-4 h-4 mr-2" />
                        {t.actions.facebook}
                      </Button>
                    )}
                    {profile.tiktok_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(normalizeUrl(profile.tiktok_url!), '_blank', 'noopener')}
                      >
                        <Music2 className="w-4 h-4 mr-2" />
                        {t.actions.tiktok}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="w-full md:w-auto md:flex-shrink-0">
                  <Card className="w-full md:w-80">
                    <CardContent className="p-6">
                      <div className="text-center mb-4">
                        <div className="text-2xl font-bold text-primary">
                          {services.length} {t.provider.services}
                        </div>
                        <p className="text-muted-foreground">{t.provider.services}</p>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => {
                          if (services.length > 0) {
                            handleBookService(services[0]);
                          }
                        }}
                        disabled={services.length === 0}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        {t.actions.book}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="grid gap-8">
              {/* Active Offers */}
              {offers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      {t.provider.offers}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:gap-4">
                      {offers.map((offer) => (
                        <div key={offer.id} className="p-3 sm:p-4 bg-gradient-to-r from-primary/5 to-primary-glow/5 rounded-lg border">
                          <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-2 mb-1 sm:mb-2">
                            <h3 className="font-semibold text-lg break-words sm:truncate sm:pr-4">{offer.title}</h3>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge className="bg-green-100 text-green-800 whitespace-nowrap">
                                {offer.discount_percentage != null && offer.discount_percentage !== undefined
                                  ? `${offer.discount_percentage}%`
                                  : `${offer.discount_amount} ${t.offers.currencySar || ''}`}
                              </Badge>
                            </div>
                          </div>
                          {offer.description && <p className="text-muted-foreground mb-2 sm:mb-3 break-words">{offer.description}</p>}
                          <p className="text-sm text-muted-foreground">
                            {new Date(offer.valid_until.seconds ? offer.valid_until.toDate() : offer.valid_until).toLocaleDateString(currentLanguage)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Services */}
              <Card>
                <CardHeader>
                  <CardTitle>{t.provider.services}</CardTitle>
                </CardHeader>
                <CardContent>
                  {services.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>{t.ui.noData}</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {services.map((service) => (
                        <div key={service.id} className="p-4 sm:p-6 border rounded-lg hover:shadow-md transition-shadow bg-muted/50 hover:bg-muted/70">
                          <div className="flex justify-between items-start mb-2 sm:mb-4">
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold mb-1 sm:mb-2">{service.name}</h3>
                              <p className="text-muted-foreground mb-2 sm:mb-3">{service.description}</p>
                              <div className="flex items-center gap-3 sm:gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{service.duration_minutes} {t.ui.minutes || 'minutes'}</span>
                                </div>
                                {service.approximate_price && (
                                  <div className="text-lg font-semibold text-primary">
                                    {profile.currency_code ? (
                                      <span>{profile.currency_code} {service.approximate_price}</span>
                                    ) : (
                                      <span>{service.approximate_price}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleBookService(service)}
                            className="w-full"
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            {t.actions.book}
                          </Button>
                          {/* Price already displayed above with currency if available */}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Reviews list is intentionally omitted since we only support star ratings summary above */}
            </div>
          </div>
        </div>
      </main>

      {/* Booking Modal */}
      {selectedService && profile && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          service={selectedService}
          provider={profile}
          currentLanguage={currentLanguage}
        />
      )}

      <Footer currentLanguage={currentLanguage} />
    </div>
  );
};

export default ProviderProfile;