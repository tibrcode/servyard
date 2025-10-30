import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Clock,
  Star,
  MapPin,
  User,
  Search,
  MessageCircle,
  Settings,
  Phone,
  MessageSquare,
  Check
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { auth, db } from "@/integrations/firebase/client";
import { collection, query, where, getDocs, doc, getDoc, orderBy, updateDoc, addDoc } from "firebase/firestore";
import { Booking, Review } from "@/lib/firebase/collections";

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

  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [services, setServices] = useState<{ [key: string]: Service }>({});
  const [providers, setProviders] = useState<{ [key: string]: Profile }>({});
  const [loading, setLoading] = useState(true);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user && role === 'customer') {
      loadCustomerData();
    } else if (!authLoading && (!user || role !== 'customer')) {
      navigate('/auth');
    }
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

      // Load customer bookings (remove orderBy to avoid index requirement)
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('customer_id', '==', user_uid)
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);
      const bookingsData = bookingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Booking[];

      // Sort bookings by created_at in JavaScript
      bookingsData.sort((a, b) => {
        const aDate = a.created_at?.toDate?.() || new Date(a.created_at);
        const bDate = b.created_at?.toDate?.() || new Date(b.created_at);
        return bDate.getTime() - aDate.getTime();
      });
      setBookings(bookingsData);

      // Load customer reviews (remove orderBy to avoid index requirement)
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('customer_id', '==', user_uid)
      );
      const reviewsSnapshot = await getDocs(reviewsQuery);
      const reviewsData = reviewsSnapshot.docs.map(doc => ({
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

      // Load related services and providers
      const serviceIds = [...new Set(bookingsData.map(b => b.service_id))];
      const providerIds = [...new Set(bookingsData.map(b => b.provider_id))];

      // Load services
      const servicesData: { [key: string]: Service } = {};
      for (const serviceId of serviceIds) {
        const serviceDoc = await getDoc(doc(db, 'services', serviceId));
        if (serviceDoc.exists()) {
          servicesData[serviceId] = { id: serviceDoc.id, ...serviceDoc.data() } as Service;
        }
      }
      setServices(servicesData);

      // Load providers
      const providersData: { [key: string]: Profile } = {};
      for (const providerId of providerIds) {
        const providerDoc = await getDoc(doc(db, 'profiles', providerId));
        if (providerDoc.exists()) {
          providersData[providerId] = { id: providerDoc.id, ...providerDoc.data() } as Profile;
        }
      }
      setProviders(providersData);

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

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    // Use badge variants for background/text colors and keep text on one line for Arabic labels
    const variants = {
      pending: "secondary",
      confirmed: "default",
      completed: "default",
      confirmed_completed: "default",
      cancelled: "destructive",
    } as const;

    const needsDarkText = ["confirmed", "completed", "confirmed_completed"].includes(status);

    return (
      <Badge
        variant={variants[status as keyof typeof variants] || "secondary"}
        className={`whitespace-nowrap leading-none px-2.5 py-0.5 ${needsDarkText ? 'text-slate-900 dark:text-slate-900' : ''}`}
      >
        <span className="whitespace-nowrap leading-none">
          {t.booking.statuses[status as keyof typeof t.booking.statuses] || status}
        </span>
      </Badge>
    );
  };

  const handleConfirmCompletion = async (bookingId: string) => {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status: 'confirmed_completed',
        updated_at: new Date()
      });

      // Update local state
      setBookings(bookings.map(booking =>
        booking.id === bookingId
          ? { ...booking, status: 'confirmed_completed' }
          : booking
      ));

      toast({
        title: t.toast.bookingCompleted,
        description: t.toast.bookingCompletedDesc,
      });
    } catch (error) {
      console.error('Error confirming completion:', error);
      toast({
        variant: "destructive",
        title: t.toast.error,
        description: t.toast.statusUpdateError
      });
    }
  };

  const handleOpenReviewModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setReviewModalOpen(true);
    setReviewRating(5);
    setIsEditingReview(false);
    setEditingReviewId(null);
  };

  const handleEditReview = (review: any) => {
    const booking = bookings.find(b => b.id === review.booking_id);
    setSelectedBooking(booking || null);
    setReviewModalOpen(true);
    setReviewRating(review.rating);
    setIsEditingReview(true);
    setEditingReviewId(review.id);
  };

  const handleSubmitReview = async () => {
    if (!selectedBooking || !user) return;

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
      } else {
        // Create new review
        const reviewData = {
          customer_id: user.uid,
          provider_id: selectedBooking.provider_id,
          service_id: selectedBooking.service_id,
          booking_id: selectedBooking.id,
          rating: reviewRating,
          comment: "", // No comment needed
          is_approved: true,
          is_comment_enabled: true,
          created_at: new Date()
        };

        await addDoc(collection(db, 'reviews'), reviewData);

        // Update local reviews state
        setReviews([...reviews, { id: Date.now().toString(), ...reviewData }]);

        toast({
          title: t.toast.reviewSubmitted || t.toast.bookingCompleted,
          description: t.toast.reviewSubmittedDesc || t.ui.interfaceUpdated,
        });
      }

      setReviewModalOpen(false);
      setSelectedBooking(null);
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
                <Search className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mb-8">
          <Card className="h-auto">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground break-words leading-tight hyphens-auto">{t.customer.totalBookings}</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold leading-tight break-words mt-1">{bookings.length}</p>
                </div>
                <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="h-auto">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground break-words leading-tight hyphens-auto">{t.customer.pendingBookings}</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold leading-tight break-words mt-1">
                    {bookings.filter(b => b.status === 'pending').length}
                  </p>
                </div>
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

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
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          <Tabs defaultValue="bookings" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="bookings">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                <span className="break-words text-xs sm:text-sm">{t.customer.myBookings}</span>
              </TabsTrigger>
              <TabsTrigger value="reviews">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                <span className="break-words text-xs sm:text-sm">{t.customer.myReviews}</span>
              </TabsTrigger>
              <TabsTrigger value="profile">
                <User className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                <span className="break-words text-xs sm:text-sm">{t.customer.profile}</span>
              </TabsTrigger>
            </TabsList>

            {/* Bookings Tab */}
            <TabsContent value="bookings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t.customer.recentBookings}</CardTitle>
                </CardHeader>
                <CardContent>
                  {bookings.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">{t.customer.noBookingsYet}</h3>
                      <p className="text-muted-foreground mb-4">
                        {t.customer.startBrowsing}
                      </p>
                      <Button onClick={() => navigate('/services')}>
                        <Search className="w-4 h-4 mr-2" />
                        {t.customer.browseServices}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bookings.map((booking) => {
                        const service = services[booking.service_id];
                        const provider = providers[booking.provider_id];

                        return (
                          <div key={booking.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-semibold">{service?.name || t.ui.noData}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {(t.customer.providerLabel || t.provider.profile) + ' '}{provider?.full_name || t.ui.noData}
                                </p>
                              </div>
                              {getStatusBadge(booking.status)}
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {(() => {
                                    const d = new Date(booking.booking_date as any);
                                    return isNaN(d.getTime()) ? booking.booking_date : d.toLocaleDateString(currentLanguage);
                                  })()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>{booking.booking_time}</span>
                              </div>
                            </div>

                            {booking.customer_notes && (
                              <div className="mt-3 text-sm">
                                <span className="font-medium">{t.customer.notes}: </span>
                                <span className="text-muted-foreground">{booking.customer_notes}</span>
                              </div>
                            )}

                            {/* Provider response / status note: always show a localized message derived from status */}
                            {booking.status && (
                              <div className="mt-3 p-3 bg-muted rounded-lg text-sm">
                                <span className="font-medium">{t.customer.providerResponse}: </span>
                                <span className="inline-block">
                                  {booking.status === 'confirmed'
                                    ? t.toast.bookingConfirmedDesc
                                    : booking.status === 'rejected'
                                      ? t.toast.bookingRejectedDesc
                                      : booking.status === 'completed' || booking.status === 'confirmed_completed'
                                        ? t.toast.bookingCompletedDesc
                                        : t.ui.noData}
                                </span>
                              </div>
                            )}

                            <div className="flex gap-2 mt-4 flex-wrap">
                              {booking.status === 'completed' && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleConfirmCompletion(booking.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Check className="w-4 h-4 mr-2" />
                                  {t.customer.confirmCompletion}
                                </Button>
                              )}
                              {(booking.status === 'completed' || booking.status === 'confirmed_completed') && !reviews.find(r => r.booking_id === booking.id) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenReviewModal(booking)}
                                >
                                  <Star className="w-4 h-4 mr-2" />
                                  {t.customer.writeReview}
                                </Button>
                              )}
                              {booking.status === 'pending' && (
                                <Button size="sm" variant="outline">
                                  {t.customer.cancel}
                                </Button>
                              )}

                              {/* Contact Provider Buttons */}
                              {provider?.phone_numbers && provider.phone_numbers.length > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(`tel:${provider.phone_numbers[0]}`, '_self')}
                                >
                                  <Phone className="w-4 h-4 mr-2" />
                                  {t.customer.call}
                                </Button>
                              )}
                              {provider?.whatsapp_number && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(`https://wa.me/${provider.whatsapp_number?.replace(/[^\d]/g, '')}`, '_blank')}
                                >
                                  <MessageSquare className="w-4 h-4 mr-2" />
                                  {t.customer.whatsapp}
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
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