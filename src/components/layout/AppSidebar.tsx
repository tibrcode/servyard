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
  Moon,
  Sun
} from "lucide-react";
import { Bell } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Globe, MapPin } from "lucide-react";
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
import { useTranslation, supportedLanguages } from "@/lib/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import BrandLogo from "@/components/BrandLogo";

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
  const languages = supportedLanguages;
  const [langOpen, setLangOpen] = React.useState(false);

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

  const handleThemeToggle = () => {
    try {
      const root = document.documentElement;
      const isDark = root.classList.contains('dark');
      root.classList.remove('light', 'dark');
      root.classList.add(isDark ? 'light' : 'dark');
    } catch { }
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
                      <span className="relative inline-flex items-center">
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

                {/* Preferences: Language, Location, Theme */}
                <SidebarMenuItem>
                  <DropdownMenu open={langOpen} onOpenChange={setLangOpen}>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton className="justify-start">
                        <Globe className="h-4 w-4 mr-2" />
                        <span>{t.nav.language}</span>
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent portalled={false} align={isRTL ? 'start' : 'end'} className="w-48">
                      {languages.map((language) => (
                        <DropdownMenuItem
                          key={language.code}
                          onClick={() => {
                            setLangOpen(false);
                            if (language.code !== currentLanguage) {
                              setTimeout(() => {
                                onLanguageChange?.(language.code);
                                if (isMobile) setOpenMobile(false);
                              }, 0);
                            }
                          }}
                          className={currentLanguage === language.code ? 'bg-accent' : ''}
                        >
                          <span className="truncate">{language.name}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <button onClick={onLocationChange} className="flex items-center w-full">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{t.nav.location}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <button onClick={handleThemeToggle} className="relative inline-flex items-center w-full">
                      <Sun className="h-4 w-4 mr-2 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                      <Moon className="h-4 w-4 mr-2 -ml-6 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                      <span className="ml-0">{t.nav.theme || 'Theme'}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
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

                {/* Language Selector */}
                <SidebarMenuItem>
                  <DropdownMenu open={langOpen} onOpenChange={setLangOpen}>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton className="justify-start">
                        <Globe className="h-4 w-4 mr-2" />
                        <span>{t.nav.language}</span>
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent portalled={false} align={isRTL ? 'start' : 'end'} className="w-48">
                      {languages.map((language) => (
                        <DropdownMenuItem
                          key={language.code}
                          onClick={() => {
                            setLangOpen(false);
                            if (language.code !== currentLanguage) {
                              setTimeout(() => {
                                onLanguageChange?.(language.code);
                                if (isMobile) setOpenMobile(false);
                              }, 0);
                            }
                          }}
                          className={currentLanguage === language.code ? 'bg-accent' : ''}
                        >
                          <span className="truncate">{language.name}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>

                {/* Location Button */}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <button onClick={onLocationChange} className="flex items-center w-full">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{t.nav.location}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Theme Toggle (labeled for consistency) */}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <button onClick={handleThemeToggle} className="relative inline-flex items-center w-full">
                      <Sun className="h-4 w-4 mr-2 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                      <Moon className="h-4 w-4 mr-2 -ml-6 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                      <span className="ml-0">{t.nav.theme || 'Theme'}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>

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