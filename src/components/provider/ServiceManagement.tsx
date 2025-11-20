import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { StarRating } from "@/components/ui/star-rating";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "@/integrations/firebase/client";
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { invalidateServicesCache } from "@/lib/servicesCache";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { Service } from "@/types/service";

interface ServiceManagementProps {
  currentLanguage: string;
  currencyCode?: string;
}

export const ServiceManagement = ({ currentLanguage, currencyCode }: ServiceManagementProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, isRTL } = useTranslation(currentLanguage);

  const getRangeLabel = (value?: string) => {
    if (!value) return '';
    const v = String(value).toLowerCase();
    if (v === 'budget') return t.addService.priceRangeBudget || 'budget';
    if (v === 'standard' || v === 'moderate') return t.addService.priceRangeStandard || 'standard';
    if (v === 'premium') return t.addService.priceRangePremium || 'premium';
    return value;
  };

  const calculateServiceRatings = async (servicesData: Service[]) => {
    const servicesWithRatings = await Promise.all(
      servicesData.map(async (service) => {
        try {
          const reviewsQuery = query(
            collection(db, 'reviews'),
            where('service_id', '==', service.id)
          );
          const reviewsSnapshot = await getDocs(reviewsQuery);
          const reviews = reviewsSnapshot.docs.map(doc => doc.data());

          if (reviews.length > 0) {
            const totalRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
            const averageRating = totalRating / reviews.length;
            return {
              ...service,
              averageRating: Number(averageRating.toFixed(1)),
              reviewCount: reviews.length
            };
          }

          return {
            ...service,
            averageRating: 0,
            reviewCount: 0
          };
        } catch (error) {
          console.error('Error calculating ratings for service:', service.id, error);
          return {
            ...service,
            averageRating: 0,
            reviewCount: 0
          };
        }
      })
    );

    return servicesWithRatings;
  };

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const servicesQuery = query(
          collection(db, 'services'),
          where('provider_id', '==', user.uid)
        );

        const servicesSnapshot = await getDocs(servicesQuery);
        let servicesData = servicesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Service[];

        // Calculate ratings for each service
        servicesData = await calculateServiceRatings(servicesData);
        setServices(servicesData);
      } catch (error) {
        console.error('Error fetching services:', error);
        toast({
          variant: "destructive",
          title: t.toast.error,
          description: t.ui.errorLoadingServices
        });
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [toast, t]);

  const toggleServiceStatus = async (serviceId: string, currentStatus: boolean) => {
    try {
      const serviceRef = doc(db, 'services', serviceId);
      await updateDoc(serviceRef, {
        is_active: !currentStatus,
        updated_at: new Date()
      });

      // Invalidate cached client services so status changes are reflected
      invalidateServicesCache();

      setServices(prev =>
        prev.map(service =>
          service.id === serviceId
            ? { ...service, is_active: !currentStatus }
            : service
        )
      );

      toast({
        title: t.ui.statusUpdated,
        description: serviceId
      });
    } catch (error) {
      console.error('Error updating service status:', error);
      toast({
        variant: "destructive",
        title: t.toast.error,
        description: t.toast.statusUpdateError
      });
    }
  };

  const deleteService = async (serviceId: string) => {
    if (!confirm(t.actions.delete + ' ?')) return;

    try {
      await deleteDoc(doc(db, 'services', serviceId));

      // Invalidate cached client services so deletions are reflected
      invalidateServicesCache();

      setServices(prev => prev.filter(service => service.id !== serviceId));

      toast({
        title: t.actions.delete,
        description: t.ui.serviceDeleted
      });
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        variant: "destructive",
        title: t.toast.error,
        description: t.ui.serviceDeleteFailed
      });
    }
  };

  const editService = (serviceId: string) => {
    navigate(`/edit-service/${serviceId}`);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-full min-w-0" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Add Service Button */}
      <div className="flex justify-end mb-6">
        <Button
          onClick={() => navigate('/add-service')}
          className="whitespace-normal break-words leading-tight w-full sm:w-auto"
          size="sm"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
          <span className="break-words text-xs sm:text-sm">{t.provider.addService}</span>
        </Button>
      </div>

      {/* Services List */}
      {services.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="py-12">
              <h3 className="text-lg font-semibold mb-2">{t.provider.noServicesYet}</h3>
              <p className="text-muted-foreground mb-4">
                {t.provider.createFirstService}
              </p>
              <Button onClick={() => navigate('/add-service')}>
                <Plus className="w-4 h-4 mr-2" />
                {t.provider.addFirstService}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {services.map((service) => (
            <Card key={service.id} className="h-auto bg-muted/50 hover:bg-muted/70 transition-colors">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <h3 className="text-base sm:text-lg font-semibold leading-snug break-words hyphens-auto min-w-0 flex-1">{service.name}</h3>
                          <Badge
                            variant={service.is_active ? "default" : "secondary"}
                            className="self-start flex-shrink-0 whitespace-normal break-words leading-tight text-xs"
                          >
                            {service.is_active ? t.provider.active : t.provider.inactive}
                          </Badge>
                        </div>
                      </div>

                      {service.description && (
                        <p className="text-muted-foreground mb-2 sm:mb-3 text-sm leading-relaxed break-words hyphens-auto">
                          {service.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                        {service.has_discount && service.discount_price ? (
                          <div className="flex items-center gap-2">
                            <span className="break-words bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 px-2 py-1 rounded text-xs leading-tight text-red-600 dark:text-red-400 font-semibold">
                              {t.provider.price}: {currencyCode ? `${currencyCode} ` : ''}{service.discount_price}
                            </span>
                            <span className="break-words bg-muted/50 px-2 py-1 rounded text-xs leading-tight line-through text-muted-foreground">
                              {currencyCode ? `${currencyCode} ` : ''}{service.approximate_price}
                            </span>
                            {service.discount_percentage && (
                              <span className="bg-red-500 text-white px-2 py-1 rounded text-[10px] font-bold">
                                -{service.discount_percentage}%
                              </span>
                            )}
                          </div>
                        ) : service.approximate_price ? (
                          <span className="break-words bg-muted/50 px-2 py-1 rounded text-xs leading-tight">
                            {t.provider.price}: {currencyCode ? `${currencyCode} ` : ''}{service.approximate_price}
                          </span>
                        ) : null}
                        {service.duration_minutes && (
                          <span className="break-words bg-muted/50 px-2 py-1 rounded text-xs leading-tight">{t.provider.duration}: {service.duration_minutes} {t.ui.minutes || 'minutes'}</span>
                        )}
                        {service.price_range && (
                          <span className="break-words bg-muted/50 px-2 py-1 rounded text-xs leading-tight">{t.provider.range}: {getRangeLabel(service.price_range)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Switch
                      checked={service.is_active}
                      onCheckedChange={() => toggleServiceStatus(service.id, service.is_active)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {service.is_active ? t.provider.active : t.provider.inactive}
                    </span>

                    <div className="flex flex-wrap gap-2 ml-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editService(service.id)}
                        className="flex-shrink-0 text-xs px-2 py-1"
                      >
                        <Edit2 className="w-3 h-3 flex-shrink-0" />
                        <span className="sr-only">{t.actions.edit}</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteService(service.id)}
                        className="flex-shrink-0 text-xs px-2 py-1"
                      >
                        <Trash2 className="w-3 h-3 flex-shrink-0" />
                        <span className="sr-only">{t.actions.delete}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
