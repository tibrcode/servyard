import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Star, Users } from "lucide-react";
import { db, auth } from "@/integrations/firebase/client";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useTranslation } from "@/lib/i18n";

interface StatsData {
  totalServices: number;
  activeServices: number;
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
}

interface StatsOverviewProps {
  currentLanguage: string;
}

export const StatsOverview = ({ currentLanguage }: StatsOverviewProps) => {
  const { t } = useTranslation(currentLanguage);
  const [stats, setStats] = useState<StatsData>({
    totalServices: 0,
    activeServices: 0,
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalReviews: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Get provider profile to get provider_id
        const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
        if (!profileDoc.exists()) return;

        const providerId = profileDoc.id;

        // Fetch services
        const servicesQuery = query(
          collection(db, 'services'),
          where('provider_id', '==', providerId)
        );
        const servicesSnapshot = await getDocs(servicesQuery);
        const services = servicesSnapshot.docs.map(doc => doc.data());

        const totalServices = services.length;
        const activeServices = services.filter(service => service.is_active).length;

        // Fetch bookings
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('provider_id', '==', providerId)
        );
        const bookingsSnapshot = await getDocs(bookingsQuery);
        const bookings = bookingsSnapshot.docs.map(doc => doc.data());

        const totalBookings = bookings.length;
        const pendingBookings = bookings.filter(booking => booking.status === 'pending').length;
        const completedBookings = bookings.filter(booking => booking.status === 'completed').length;

        // Fetch reviews
        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('provider_id', '==', providerId)
        );
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const reviews = reviewsSnapshot.docs.map(doc => doc.data());

        const totalReviews = reviews.length;
        const averageRating = reviews.length > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
          : 0;

        // Calculate revenue (mock calculation based on completed bookings)
        const totalRevenue = completedBookings * 75; // Average price estimation

        setStats({
          totalServices,
          activeServices,
          totalBookings,
          pendingBookings,
          completedBookings,
          totalRevenue,
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews
        });

      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-muted/50">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="animate-pulse flex flex-col items-center gap-2">
                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gray-200 rounded-full"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: t.provider.activeServices,
      value: stats.activeServices,
      total: stats.totalServices,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: t.provider.pendingBookings,
      value: stats.pendingBookings,
      total: stats.totalBookings,
      icon: Calendar,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100"
    },
    {
      title: t.provider.revenue,
      value: stats.totalRevenue,
      subtitle: `${stats.completedBookings} ${t.customer.completed}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: t.provider.rating,
      value: stats.averageRating || "N/A",
      subtitle: `${stats.totalReviews} ${t.provider.reviews}`,
      icon: Star,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-8">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="bg-muted/50 hover:bg-muted/70 transition-colors">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col items-center text-center gap-2">
                <div className={`${stat.bgColor} p-2 sm:p-3 rounded-full`}>
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
                </div>
                <div className="w-full">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                    {stat.title}
                  </p>
                  <div className="flex items-center justify-center gap-1 sm:gap-2 mt-1">
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold">
                      {stat.value}
                    </p>
                    {stat.total !== undefined && (
                      <Badge variant="secondary" className="text-xs">
                        / {stat.total}
                      </Badge>
                    )}
                  </div>
                  {stat.subtitle && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {stat.subtitle}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};