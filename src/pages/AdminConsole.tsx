import { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Users,
  AlertTriangle,
  BarChart3,
  Settings,
  Trash2,
  Eye,
  Ban,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/integrations/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { useTranslation } from "@/lib/i18n";
import { upsertCategoryTranslations } from "@/lib/firebase/migrations/upsertCategoryTranslations";

interface AdminConsoleProps {
  currentLanguage: string;
}

const AdminConsole = ({ currentLanguage = 'en' }: AdminConsoleProps) => {
  const { t, isRTL } = useTranslation(currentLanguage);
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProviders: 0,
    totalServices: 0,
    pendingReports: 0,
    activeBookings: 0
  });
  // Ensure auto-run only executes once
  const autoRanRef = useRef(false);
  // Query flags (dev-only migration bypass)
  const hasUpsertParam = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('upsertCats');
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // For now, we'll just check if it's a specific admin email
        // In a real app, you'd check admin roles in Firestore
        const isAdmin = user.email === 'admin@servyard.com'; // Replace with your admin email
        setIsAuthorized(isAdmin);
      } else {
        setIsAuthorized(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Optional auto-run of category translations migration via URL query param
  useEffect(() => {
    if (autoRanRef.current) return;
    const hasParam = hasUpsertParam;
    const canRun = (isAuthorized === true) || (hasParam && isLocalhost);
    if (!hasParam || !canRun) return;
    if (hasParam) {
      autoRanRef.current = true;
      (async () => {
        try {
          const res = await upsertCategoryTranslations();
          toast({
            title: "Category translations updated",
            description: `Scanned ${res.docsScanned} • Updated ${res.docsUpdated} docs • ${res.fieldsUpdated} fields`,
          });
        } catch (e: any) {
          toast({
            variant: "destructive",
            title: "Migration failed",
            description: e?.message || String(e),
          });
        }
        // Clean the URL so refresh doesn't auto-run again
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete('upsertCats');
          window.history.replaceState({}, '', url.pathname + url.search + url.hash);
        } catch { }
      })();
    }
  }, [isAuthorized, toast, hasUpsertParam, isLocalhost]);

  // Redirect if not authorized, except when running dev migration via query flag on localhost
  if (isAuthorized === false && !(hasUpsertParam && isLocalhost)) {
    return <Navigate to="/" replace />;
  }

  // Loading state
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Admin Console</h1>
          <Badge variant="destructive">Super Admin</Badge>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Providers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProviders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Services</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalServices}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingReports}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeBookings}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Admin Dashboard</h3>
                  <p>Firebase integration is set up. User management features will be added soon.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">User Management</h3>
                  <p>User management features coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Analytics</h3>
                  <p>Advanced analytics dashboard coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-6 text-muted-foreground">
                    <Settings className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <h3 className="text-base font-medium mb-1">Settings</h3>
                    <p className="text-sm">Admin utilities and data migrations</p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          const res = await upsertCategoryTranslations();
                          toast({
                            title: "Category translations updated",
                            description: `Scanned ${res.docsScanned} • Updated ${res.docsUpdated} docs • ${res.fieldsUpdated} fields`,
                          });
                        } catch (e: any) {
                          toast({
                            variant: "destructive",
                            title: "Migration failed",
                            description: e?.message || String(e),
                          });
                        }
                      }}
                    >
                      Upsert Category Translations (All Languages)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminConsole;