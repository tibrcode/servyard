import React from "react";
import {
  Home,
  Search,
  User,
  Users,
  Settings,
  LogIn,
  UserPlus,
  LayoutDashboard,
  Building2,
  ShoppingBag,
  LogOut,
  Clock,
  Heart,
  HelpCircle
} from "lucide-react";
import { Bell } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useNotificationLog } from "@/contexts/NotificationLogContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/contexts/AuthContext";
import BrandLogo from "@/components/BrandLogo";
import { AdBanner } from "@/components/ads/AdBanner";

interface AppSidebarProps {
  currentLanguage?: string;
  onLanguageChange?: (language: string) => void;
  onLocationChange?: () => void;
}

export function AppSidebar({ currentLanguage = 'en', onLanguageChange, onLocationChange }: AppSidebarProps) {
  const { setOpenMobile, isMobile } = useSidebar();
  const location = useLocation();
  const { t, isRTL } = useTranslation(currentLanguage);
  const { user, role, signOut, displayName } = useAuth();
  const { unreadCount } = useNotificationLog();
  const currentPath = location.pathname;

  const handleNavigation = () => {
    // Close sidebar on mobile after navigation
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  React.useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [location.pathname, isMobile, setOpenMobile]);

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted/50";

  const mainNavItems = [
    { title: t.nav.home, url: "/", icon: Home },
    { title: t.nav.services, url: "/services", icon: Search },
    { title: t.nav.notifications || 'Notifications', url: "/notifications", icon: Bell, badge: unreadCount },
    { title: t.favorites?.title || t.dashboardCommon?.favorites || 'Favorites', url: "/favorites", icon: Heart },
    { title: t.timezone?.title || t.settingsPage?.timezone || 'Timezone', url: "/timezone", icon: Clock },
    { title: t.userGuide?.title || 'User Guide', url: "/user-guide", icon: HelpCircle },
  ];

  const authNavItems = user ? [] : [
    { title: t.auth.login, url: "/auth", icon: LogIn },
    { title: t.auth.joinAsProvider, url: "/provider-signup", icon: Building2 },
    { title: t.auth.joinAsCustomer, url: "/customer-signup", icon: ShoppingBag },
  ];

  // Dashboard entry will be shown under Account (below the display name)

  const handleLogout = async () => {
    await signOut();
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar
      side={isRTL ? "right" : "left"}
      variant="sidebar"
      collapsible="icon"
    >
      <SidebarContent dir={isRTL ? 'rtl' : 'ltr'}>
        {/* App Header */}
        <SidebarHeader>
          <div className="flex items-center justify-center px-4 py-6">
            <BrandLogo height={92} />
          </div>
        </SidebarHeader>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={isRTL ? 'text-right' : 'text-left'}>
            {t.dashboard.main}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) => getNavCls({ isActive })}
                      onClick={handleNavigation}
                    >
                      <span className="relative inline-flex items-center" aria-label={item.badge ? `${item.title} (${item.badge} unread)` : item.title} title={item.badge ? `${item.badge} unread` : item.title}>
                        <item.icon className="h-4 w-4 mr-2" />
                        <span>{item.title}</span>
                        {item.badge ? (
                          <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] leading-none h-4 min-w-[16px] px-1">
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        ) : null}
                      </span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Authentication - Only show if not logged in */}
        {authNavItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className={isRTL ? 'text-right' : 'text-left'}>
              {t.dashboard.account}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {authNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) => getNavCls({ isActive })}
                        onClick={handleNavigation}
                      >
                        <item.icon className="h-4 w-4 mr-2" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Dashboards group removed; dashboard link shown under Account */}

        {/* Account & Preferences */}
        {user && (
          <SidebarGroup>
            <SidebarGroupLabel className={isRTL ? 'text-right' : 'text-left'}>
              {t.dashboard.account}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* User display name (non-clickable) */}
                <SidebarMenuItem>
                  <div className="flex items-start px-2 py-1.5 text-sm text-foreground/80">
                    <User className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="break-words whitespace-normal leading-tight">{displayName}</span>
                  </div>
                </SidebarMenuItem>

                {/* Dashboard link (short label) */}
                {(role === 'provider' || role === 'customer') && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={role === 'provider' ? '/provider-dashboard' : '/customer-dashboard'}
                        className={({ isActive }) => getNavCls({ isActive })}
                        onClick={handleNavigation}
                      >
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        <span>{role === 'provider' ? (t.provider.dashboard || t.dashboard.main) : (t.customer.dashboard || t.dashboard.main)}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <button onClick={handleLogout} className="flex items-center w-full">
                      <LogOut className="h-4 w-4 mr-2" />
                      <span>{t.userInterface.logout}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}


      </SidebarContent>
    </Sidebar>
  );
}