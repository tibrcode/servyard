import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, TrendingUp, Users, BarChart } from "lucide-react";
import { db } from "@/integrations/firebase/client";
import { collection, getDocs, query, where } from "firebase/firestore";

interface LocationAnalyticsProps {
  currentLanguage: string;
}

interface RegionStats {
  region: string;
  country: string;
  city: string;
  providerCount: number;
  serviceCount: number;
}

/**
 * مكون تحليلات الموقع الجغرافي
 * Location Analytics Component
 * 
 * يعرض:
 * - أكثر المناطق نشاطاً
 * - عدد المزودين لكل منطقة
 * - عدد الخدمات لكل منطقة
 * - إحصائيات عامة
 */
const LocationAnalytics: React.FC<LocationAnalyticsProps> = ({ currentLanguage }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RegionStats[]>([]);
  const [totalProviders, setTotalProviders] = useState(0);
  const [totalCountries, setTotalCountries] = useState(0);

  const isRTL = currentLanguage === 'ar';

  const t = {
    title: isRTL ? "تحليلات الموقع الجغرافي" : "Location Analytics",
    description: isRTL 
      ? "إحصائيات المزودين والخدمات حسب المنطقة"
      : "Provider and service statistics by region",
    loading: isRTL ? "جاري التحميل..." : "Loading...",
    topRegions: isRTL ? "أكثر المناطق نشاطاً" : "Most Active Regions",
    providers: isRTL ? "مزود" : "Providers",
    services: isRTL ? "خدمة" : "Services",
    countries: isRTL ? "بلد" : "Countries",
    totalProviders: isRTL ? "إجمالي المزودين" : "Total Providers",
    noData: isRTL ? "لا توجد بيانات" : "No data available"
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      // جلب جميع المزودين
      const providersSnapshot = await getDocs(
        query(collection(db, 'profiles'), where('user_type', '==', 'provider'))
      );

      const regionMap: Record<string, RegionStats> = {};
      const countries = new Set<string>();

      // معالجة بيانات المزودين
      for (const doc of providersSnapshot.docs) {
        const data = doc.data();
        const country = data.country || 'Unknown';
        const city = data.city || 'Unknown';
        const region = `${country} - ${city}`;

        countries.add(country);

        if (!regionMap[region]) {
          regionMap[region] = {
            region,
            country,
            city,
            providerCount: 0,
            serviceCount: 0
          };
        }

        regionMap[region].providerCount++;

        // جلب خدمات المزود
        const servicesSnapshot = await getDocs(
          query(
            collection(db, 'services'),
            where('provider_id', '==', doc.id),
            where('is_active', '==', true)
          )
        );

        regionMap[region].serviceCount += servicesSnapshot.size;
      }

      // تحويل إلى مصفوفة وترتيب
      const statsArray = Object.values(regionMap).sort(
        (a, b) => b.providerCount - a.providerCount
      );

      setStats(statsArray);
      setTotalProviders(providersSnapshot.size);
      setTotalCountries(countries.size);

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">{t.loading}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* إحصائيات عامة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t.totalProviders}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalProviders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {t.countries}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalCountries}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart className="w-4 h-4" />
              {t.topRegions}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* أكثر المناطق نشاطاً */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            {t.topRegions}
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t.noData}
            </div>
          ) : (
            <div className="space-y-4">
              {stats.slice(0, 10).map((region, index) => (
                <div
                  key={region.region}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{region.city}</div>
                      <div className="text-sm text-muted-foreground">{region.country}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {region.providerCount} {t.providers}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {region.serviceCount} {t.services}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationAnalytics;
