import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Star,
  User,
  MapPin,
  MessageCircle,
  Settings,
  Bell
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { auth, db } from "@/integrations/firebase/client";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, onSnapshot } from "firebase/firestore";
import { Review } from "@/lib/firebase/collections";
import { MyBookings } from "@/components/booking/MyBookings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";

interface CustomerDashboardProps {
  currentLanguage: string;
}

interface Service {
  id: string;
  name: string;
  provider_id: string;
  approximate_price?: string;
  duration_minutes?: number;
}

interface Profile {
  id: string;
  full_name: string;
  city?: string;
  country?: string;
  phone_numbers?: string[];
  whatsapp_number?: string;
}

const CustomerDashboard = ({ currentLanguage }: CustomerDashboardProps) => {
  const { t, isRTL } = useTranslation(currentLanguage);
  const { user, role, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [services, setServices] = useState<{ [key: string]: Service }>({});
  const [providers, setProviders] = useState<{ [key: string]: Profile }>({});
  const [loading, setLoading] = useState(true);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user && role === 'customer') {
      loadCustomerData();
    } else if (!authLoading && (!user || role !== 'customer')) {
      navigate('/auth');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, role, authLoading, navigate]);

  const loadCustomerData = async () => {
    try {
      const user_uid = user?.uid;
      if (!user_uid) return;

      // Load customer profile
      const profileDoc = await getDoc(doc(db, 'profiles', user_uid));
      if (profileDoc.exists()) {
        setProfile({ id: profileDoc.id, ...profileDoc.data() } as Profile);
      }

      // Real-time listener for customer reviews
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('customer_id', '==', user_uid)
      );
      
      onSnapshot(reviewsQuery, async (snapshot) => {
        const reviewsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Review[];

        // Sort reviews by created_at in JavaScript
        reviewsData.sort((a, b) => {
          const aDate = a.created_at?.toDate?.() || new Date(a.created_at);
          const bDate = b.created_at?.toDate?.() || new Date(b.created_at);
          return bDate.getTime() - aDate.getTime();
        });
        setReviews(reviewsData);

        // Load related services and providers from reviews
        const serviceIds = [...new Set(reviewsData.map((r: any) => r.service_id).filter(Boolean))];
        const providerIds = [...new Set(reviewsData.map((r: any) => r.provider_id).filter(Boolean))];

        // Load services
        const servicesData: { [key: string]: Service } = {};
        for (const serviceId of serviceIds) {
          const serviceDoc = await getDoc(doc(db, 'services', serviceId as string));
          if (serviceDoc.exists()) {
            servicesData[serviceId as string] = { id: serviceDoc.id, ...serviceDoc.data() } as Service;
          }
        }
        setServices(servicesData);

        // Load providers
        const providersData: { [key: string]: Profile } = {};
        for (const providerId of providerIds) {
          const providerDoc = await getDoc(doc(db, 'profiles', providerId as string));
          if (providerDoc.exists()) {
            providersData[providerId as string] = { id: providerDoc.id, ...providerDoc.data() } as Profile;
          }
        }
        setProviders(providersData);
      });

    } catch (error) {
      console.error('Error loading customer data:', error);
      toast({
        variant: "destructive",
        title: t.toast.error,
        description: t.ui.errorLoadingServices
      });
    } finally {
      setLoading(false);
    }
  };

  // Highlight booking if bookingId query param present (persistent until interaction)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const bookingId = params.get('bookingId');
    if (!bookingId) return;
    // Delay to allow list render
    const t = setTimeout(() => {
      const el = document.querySelector(`[data-booking-id="${bookingId}"]`) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-primary');
        setHighlightedId(bookingId);
        const clear = () => {
          el.classList.remove('ring-2');
          el.classList.remove('ring-primary');
          el.removeEventListener('click', clear);
          el.removeEventListener('keydown', clear);
          el.removeEventListener('touchstart', clear);
        };
        el.addEventListener('click', clear, { once: true });
        el.addEventListener('keydown', clear, { once: true });
        el.addEventListener('touchstart', clear, { once: true });
        setTimeout(clear, 30000);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [location.search]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Review functions simplified - no longer dependent on old booking system
  const handleEditReview = (review: any) => {
    setReviewModalOpen(true);
    setReviewRating(review.rating);
    setIsEditingReview(true);
    setEditingReviewId(review.id);
  };

  const handleSubmitReview = async () => {
    if (!user) return;

    try {
      if (isEditingReview && editingReviewId) {
        // Update existing review
        const reviewRef = doc(db, 'reviews', editingReviewId);
        await updateDoc(reviewRef, {
          rating: reviewRating,
          created_at: new Date()
        });

        // Update local reviews state
        setReviews(reviews.map(review =>
          review.id === editingReviewId
            ? { ...review, rating: reviewRating }
            : review
        ));

        toast({
          title: t.toast.reviewUpdated || t.toast.bookingCompleted,
          description: t.toast.reviewUpdatedDesc || t.ui.interfaceUpdated,
        });
      }

      setReviewModalOpen(false);
      setReviewRating(5);
      setIsEditingReview(false);
      setEditingReviewId(null);
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        variant: "destructive",
        title: t.toast.error,
        description: t.toast.reviewErrorDesc || t.toast.statusUpdateError,
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-start justify-between gap-4 w-full max-w-full">
            <div className="min-w-0 flex-1 w-full max-w-full">
              <h1 className="dashboard-title text-xl sm:text-2xl lg:text-3xl font-bold text-primary leading-snug truncate max-w-full">
                {t.customer.welcomeBack}, <span className="provider-name whitespace-normal overflow-wrap-anywhere word-break-break-word">{profile?.full_name || t.ui.noData}</span>!
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed break-words hyphens-auto mt-1 whitespace-normal overflow-wrap-anywhere word-break-break-word w-full max-w-full">
                {t.customer.manageBookings}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => navigate('/services')}
                className="flex items-center gap-2 whitespace-normal break-words leading-tight min-w-0 flex-1 sm:flex-initial"
              >
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="break-words text-xs sm:text-sm">{t.userInterface.browseServices}</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/edit-profile')}
                className="flex items-center gap-2 whitespace-normal break-words leading-tight min-w-0 flex-1 sm:flex-initial"
              >
                <Settings className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="break-words text-xs sm:text-sm">{t.userInterface.editProfile}</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex items-center gap-2 whitespace-normal break-words leading-tight min-w-0 flex-1 sm:flex-initial"
              >
                <Settings className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="break-words text-xs sm:text-sm">{t.userInterface.logout}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          <Card className="h-auto">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground break-words leading-tight hyphens-auto">{t.customer.reviewsGiven}</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold leading-tight break-words mt-1">{reviews.length}</p>
                </div>
                <Star className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="h-auto">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground break-words leading-tight hyphens-auto">{isRTL ? 'الملف الشخصي' : 'Profile'}</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold leading-tight break-words mt-1">{profile?.full_name || t.ui.noData}</p>
                </div>
                <User className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          <Tabs defaultValue="appointments" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="appointments">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                <span className="break-words text-xs sm:text-sm">{isRTL ? 'حجوزاتي' : 'My Bookings'}</span>
              </TabsTrigger>
              <TabsTrigger value="reviews">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                <span className="break-words text-xs sm:text-sm">{t.customer.myReviews}</span>
              </TabsTrigger>
              <TabsTrigger value="profile">
                <User className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                <span className="break-words text-xs sm:text-sm">{t.customer.profile}</span>
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Bell className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                <span className="break-words text-xs sm:text-sm">{isRTL ? 'الإعدادات' : 'Settings'}</span>
              </TabsTrigger>
            </TabsList>

            {/* Bookings Tab - Unified Modern Booking System */}
            <TabsContent value="appointments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{isRTL ? 'حجوزاتي' : 'My Bookings'}</CardTitle>
                </CardHeader>
                <CardContent>
                  {user && (
                    <MyBookings
                      customerId={user.uid}
                      language={currentLanguage as 'en' | 'ar'}
                      cancellationPolicyHours={24}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t.customer.myReviews}</CardTitle>
                </CardHeader>
                <CardContent>
                  {reviews.length === 0 ? (
                    <div className="text-center py-12">
                      <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">{t.customer.noReviewsYet}</h3>
                      <p className="text-muted-foreground mb-4">{t.customer.startReviewing}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review, index) => {
                        const service = services[review.service_id];
                        const provider = providers[review.provider_id];

                        return (
                          <div key={review.id || index} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-semibold">{service?.name || t.ui.noData}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {t.customer.providerLabel || t.provider.profile} {provider?.full_name || t.ui.noData}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm font-medium whitespace-nowrap tabular-nums">
                                  {review.rating} {t.customer.outOf5 || "/5"}
                                </span>
                              </div>
                            </div>

                            {review.comment && (
                              <p className="text-sm text-muted-foreground mb-3">{review.comment}</p>
                            )}

                            <div className="text-xs text-muted-foreground">
                              {review.created_at && new Date(review.created_at.seconds ? review.created_at.toDate() : review.created_at).toLocaleDateString(currentLanguage)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t.customer.profile}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">{t.auth.fullName}</Label>
                        <p className="text-sm text-muted-foreground mt-1">{profile?.full_name || t.ui.noData}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">{t.auth.city}</Label>
                        <p className="text-sm text-muted-foreground mt-1">{profile?.city || t.ui.noData}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">{t.auth.country}</Label>
                        <p className="text-sm text-muted-foreground mt-1">{profile?.country || t.ui.noData}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">{t.auth.whatsappNumber}</Label>
                        <p className="text-sm text-muted-foreground mt-1">{profile?.whatsapp_number || t.ui.noData}</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">{t.auth.phoneNumbers}</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {profile?.phone_numbers && profile.phone_numbers.length > 0
                          ? profile.phone_numbers.join(', ')
                          : t.ui.noData
                        }
                      </p>
                    </div>

                    <div className="mt-6">
                      <Button onClick={() => navigate('/edit-profile')}>
                        <Settings className="w-4 h-4 mr-2" />
                        {t.userInterface.editProfile}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab - Notification Preferences */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{isRTL ? 'إعدادات الإشعارات' : 'Notification Settings'}</CardTitle>
                </CardHeader>
                <CardContent>
                  {user && (
                    <NotificationSettings
                      userId={user.uid}
                      language={currentLanguage as 'en' | 'ar'}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Review Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditingReview ? (t.customer.reviewsModal?.editTitle || t.customer.editReview) : (t.customer.reviewsModal?.createTitle || t.customer.writeReview)}
            </DialogTitle>
            <DialogDescription>
              {isEditingReview
                ? (t.customer.reviewsModal?.editDescription || t.customer.editReview)
                : (t.customer.reviewsModal?.createDescription || t.customer.writeReview)
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Rating Stars */}
            <div className="flex flex-col items-center space-y-2">
              <div className="flex space-x-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setReviewRating(i + 1)}
                    className="p-1 transition-colors"
                  >
                    <Star
                      className={`w-8 h-8 ${i < reviewRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    />
                  </button>
                ))}
              </div>

              <p className="text-sm text-muted-foreground">
                {t.customer.reviewsModal?.ratingLabels?.[reviewRating - 1]}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setReviewModalOpen(false)}>
                {t.customer.cancel}
              </Button>
              <Button onClick={handleSubmitReview}>
                {isEditingReview ? (t.customer.editReview || t.forms.update) : (t.customer.writeReview || t.forms.submit)}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer currentLanguage={currentLanguage} />
    </div>
  );
};

export default CustomerDashboard;