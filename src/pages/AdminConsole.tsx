import { useState, useEffect, useRef } from "react";
// No redirect; show explicit Unauthorized message when needed
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
import { auth, db } from "@/integrations/firebase/client";
import { collection, doc, getDoc, getCountFromServer, query, where, limit, getDocs, orderBy, startAfter, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useTranslation } from "@/lib/i18n";
import { upsertCategoryTranslations } from "@/lib/firebase/migrations/upsertCategoryTranslations";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isAdminEmail } from "@/lib/adminAccess";

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
  const [derivedStats, setDerivedStats] = useState({
    customers: 0,
    incomplete: 0,
  });
  const [loadingStats, setLoadingStats] = useState<boolean>(false);
  const [deleteField, setDeleteField] = useState<string>("");
  const [deleteMode, setDeleteMode] = useState<"email" | "uid">("email");
  const [deleting, setDeleting] = useState<boolean>(false);
  const [findField, setFindField] = useState<string>("");
  const [findMode, setFindMode] = useState<"email" | "uid">("email");
  const [finding, setFinding] = useState<boolean>(false);
  const [foundProfile, setFoundProfile] = useState<any | null>(null);
  // Users list (paginated)
  const [users, setUsers] = useState<any[]>([]);
  const [usersRoleFilter, setUsersRoleFilter] = useState<"all" | "provider" | "customer">("all");
  const [usersLoading, setUsersLoading] = useState<boolean>(false);
  const [usersEnd, setUsersEnd] = useState<boolean>(false);
  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  // Ensure auto-run only executes once
  const autoRanRef = useRef(false);
  // Query flags (dev-only migration bypass)
  const hasUpsertParam = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('upsertCats');
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // Centralized admin check (env-configurable)
        const isAdmin = isAdminEmail(user.email || undefined);
        setIsAuthorized(isAdmin);
      } else {
        setIsAuthorized(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load basic stats from Firestore (profiles/services). New users appear after profile creation.
  useEffect(() => {
    if (isAuthorized !== true) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingStats(true);
        const profilesRef = collection(db, "profiles");
        const servicesRef = collection(db, "services");

        const [usersSnap, providersSnap, servicesSnap, customersSnap] = await Promise.all([
          getCountFromServer(profilesRef),
          getCountFromServer(query(profilesRef, where("user_type", "==", "provider"))),
          getCountFromServer(servicesRef),
          getCountFromServer(query(profilesRef, where("user_type", "==", "customer"))),
        ]);

        if (cancelled) return;
        setStats((s) => ({
          ...s,
          totalUsers: usersSnap.data().count || 0,
          totalProviders: providersSnap.data().count || 0,
          totalServices: servicesSnap.data().count || 0,
        }));
        const total = usersSnap.data().count || 0;
        const providers = providersSnap.data().count || 0;
        const customers = customersSnap.data().count || 0;
        setDerivedStats({
          customers,
          incomplete: Math.max(0, total - providers - customers),
        });
      } catch (e) {
        console.warn("Failed to load admin stats", e);
      } finally {
        if (!cancelled) setLoadingStats(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthorized]);

  // Load users list (paged by 50, ordered by email). Optional role filter.
  const PAGE_SIZE = 50;
  const loadUsers = async (reset = false) => {
    if (usersLoading) return;
    try {
      setUsersLoading(true);
      if (reset) {
        setUsers([]);
        setUsersEnd(false);
        lastDocRef.current = null;
      }
      let base = collection(db, 'profiles');
      let qBase;
      if (usersRoleFilter === 'all') {
        qBase = query(base, orderBy('email'), limit(PAGE_SIZE));
      } else {
        qBase = query(base, where('user_type', '==', usersRoleFilter), orderBy('email'), limit(PAGE_SIZE));
      }
      if (!reset && lastDocRef.current) {
        if (usersRoleFilter === 'all') {
          qBase = query(base, orderBy('email'), startAfter(lastDocRef.current), limit(PAGE_SIZE));
        } else {
          qBase = query(base, where('user_type', '==', usersRoleFilter), orderBy('email'), startAfter(lastDocRef.current), limit(PAGE_SIZE));
        }
      }
      const snap = await getDocs(qBase);
      const newDocs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (snap.docs.length > 0) {
        lastDocRef.current = snap.docs[snap.docs.length - 1] as QueryDocumentSnapshot<DocumentData>;
      }
      setUsers((prev) => (reset ? newDocs : [...prev, ...newDocs]));
      if (snap.docs.length < PAGE_SIZE) setUsersEnd(true);
    } catch (e) {
      console.warn('Failed to load users list', e);
      toast({ variant: 'destructive', title: 'Failed to load users', description: (e as any)?.message || String(e) });
    } finally {
      setUsersLoading(false);
    }
  };

  // Initial users load when authorized; reload when filter changes
  useEffect(() => {
    if (isAuthorized !== true) return;
    loadUsers(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorized, usersRoleFilter]);

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

  // If unauthorized (and not explicitly running dev migration on localhost), show message instead of silent redirect
  if (isAuthorized === false && !(hasUpsertParam && isLocalhost)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Unauthorized</h2>
          <p className="text-muted-foreground mb-6">
            You don't have access to the Admin Console. Please sign in with an authorized company email.
          </p>
        </div>
      </div>
    );
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
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{derivedStats.customers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Incomplete Profiles</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{derivedStats.incomplete}</div>
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
            {/* Users list with role filter and load more */}
            <Card>
              <CardHeader>
                <CardTitle>Users List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Label>Filter:</Label>
                    <div className="flex gap-2">
                      <Button size="sm" variant={usersRoleFilter === 'all' ? 'default' : 'outline'} onClick={() => setUsersRoleFilter('all')}>All</Button>
                      <Button size="sm" variant={usersRoleFilter === 'provider' ? 'default' : 'outline'} onClick={() => setUsersRoleFilter('provider')}>Providers</Button>
                      <Button size="sm" variant={usersRoleFilter === 'customer' ? 'default' : 'outline'} onClick={() => setUsersRoleFilter('customer')}>Customers</Button>
                    </div>
                  </div>
                  <div className="ml-auto">
                    <Button size="sm" variant="outline" onClick={() => loadUsers(true)} disabled={usersLoading}>Refresh</Button>
                  </div>
                </div>

                <div className="rounded-md border divide-y">
                  <div className="grid grid-cols-4 gap-2 px-3 py-2 text-xs text-muted-foreground">
                    <div>Name</div>
                    <div>Email</div>
                    <div>Role</div>
                    <div>UID</div>
                  </div>
                  {users.map((u) => (
                    <div key={u.id} className="grid grid-cols-4 gap-2 px-3 py-2 text-sm">
                      <div className="truncate" title={u.full_name || '—'}>{u.full_name || '—'}</div>
                      <div className="truncate" title={u.email || '—'}>{u.email || '—'}</div>
                      <div>{u.user_type || 'unknown'}</div>
                      <div className="truncate" title={u.id}>{u.id}</div>
                    </div>
                  ))}
                  {users.length === 0 && !usersLoading && (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">No users to display.</div>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Showing {users.length} {usersRoleFilter === 'all' ? 'users' : usersRoleFilter}
                  </div>
                  <div className="flex gap-2">
                    {!usersEnd && (
                      <Button size="sm" onClick={() => loadUsers(false)} disabled={usersLoading}>{usersLoading ? 'Loading…' : 'Load more'}</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Simple user lookup to verify presence of newly created accounts (requires profile doc) */}
            <Card>
              <CardHeader>
                <CardTitle>Find a user</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="flex flex-col md:flex-row gap-3 md:items-end">
                    <div className="flex-1">
                      <Label htmlFor="findField">{findMode === 'email' ? 'Email' : 'UID'}</Label>
                      <Input id="findField" placeholder={findMode === 'email' ? 'user@example.com' : 'UID'} value={findField} onChange={(e) => setFindField(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant={findMode === 'email' ? 'default' : 'outline'} onClick={() => setFindMode('email')}>By Email</Button>
                      <Button type="button" variant={findMode === 'uid' ? 'default' : 'outline'} onClick={() => setFindMode('uid')}>By UID</Button>
                    </div>
                    <div>
                      <Button
                        disabled={finding || !findField}
                        onClick={async () => {
                          setFinding(true);
                          setFoundProfile(null);
                          try {
                            if (findMode === 'uid') {
                              const snap = await getDoc(doc(db, 'profiles', findField.trim()));
                              setFoundProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null);
                            } else {
                              const q = query(collection(db, 'profiles'), where('email', '==', findField.trim().toLowerCase()), limit(1));
                              const qs = await getDocs(q);
                              const first = qs.docs[0];
                              setFoundProfile(first ? { id: first.id, ...first.data() } : null);
                            }
                          } catch (e: any) {
                            toast({ variant: 'destructive', title: 'Lookup failed', description: e?.message || String(e) });
                          } finally {
                            setFinding(false);
                          }
                        }}
                      >
                        {finding ? 'Searching…' : 'Find'}
                      </Button>
                    </div>
                  </div>

                  <div>
                    {foundProfile ? (
                      <div className="rounded-md border p-4 text-left">
                        <div className="font-medium mb-1">Profile</div>
                        <div className="text-sm text-muted-foreground break-words">
                          <div><strong>UID:</strong> {foundProfile.id}</div>
                          {foundProfile.full_name && (<div><strong>Name:</strong> {foundProfile.full_name}</div>)}
                          {foundProfile.email && (<div><strong>Email:</strong> {foundProfile.email}</div>)}
                          {foundProfile.user_type && (<div><strong>Role:</strong> {foundProfile.user_type}</div>)}
                        </div>
                      </div>
                    ) : (
                      findField && !finding && (
                        <div className="text-sm text-muted-foreground">No profile found. New Auth users appear here after creating their profile.</div>
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div>
                    <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                      <Trash2 className="h-4 w-4 text-red-600" /> Delete a user (Auth + all related data)
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose by email or UID. This will permanently delete the Firebase Auth user and all Firestore records related to them.
                    </p>
                    <div className="flex flex-col md:flex-row gap-3 md:items-end">
                      <div className="flex-1">
                        <Label htmlFor="deleteField">{deleteMode === 'email' ? 'Email' : 'UID'}</Label>
                        <Input id="deleteField" placeholder={deleteMode === 'email' ? 'user@example.com' : 'UID'} value={deleteField} onChange={(e) => setDeleteField(e.target.value)} />
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant={deleteMode === 'email' ? 'default' : 'outline'} onClick={() => setDeleteMode('email')}>By Email</Button>
                        <Button type="button" variant={deleteMode === 'uid' ? 'default' : 'outline'} onClick={() => setDeleteMode('uid')}>By UID</Button>
                      </div>
                      <div>
                        <Button
                          variant="destructive"
                          disabled={deleting || !deleteField}
                          onClick={async () => {
                            if (!currentUser) return;
                            setDeleting(true);
                            try {
                              const idToken = await currentUser.getIdToken();
                              const body: any = deleteMode === 'email' ? { email: deleteField } : { uid: deleteField };
                              const resp = await fetch('https://us-central1-servyard-de527.cloudfunctions.net/adminDeleteUser', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${idToken}`,
                                },
                                body: JSON.stringify(body),
                              });
                              if (!resp.ok) {
                                const text = await resp.text();
                                throw new Error(text || `Request failed (${resp.status})`);
                              }
                              toast({ title: 'User deleted', description: 'Auth account and related data were removed.' });
                              setDeleteField('');
                            } catch (e: any) {
                              toast({ variant: 'destructive', title: 'Deletion failed', description: e?.message || String(e) });
                            } finally {
                              setDeleting(false);
                            }
                          }}
                        >
                          {deleting ? 'Deleting…' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  </div>
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