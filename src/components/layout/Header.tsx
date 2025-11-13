import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Globe, MapPin, User, UserPlus, LogOut, Sun, Moon, Shield, Bell, Clock } from "lucide-react";
import { useNotificationLog } from "@/contexts/NotificationLogContext";
import { useTranslation, supportedLanguages } from "@/lib/i18n";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Link, useNavigate } from "react-router-dom";
import BrandLogo from "@/components/BrandLogo";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminEmail } from "@/lib/adminAccess";

interface HeaderProps {
  currentLanguage?: string;
  onLanguageChange?: (language: string) => void;
  onLocationChange?: () => void;
}

export const Header = ({
  currentLanguage = 'en',
  onLanguageChange,
  onLocationChange
}: HeaderProps) => {
  const { t, isRTL } = useTranslation(currentLanguage);
  const { user, displayName, role, signOut: doSignOut, loading } = useAuth();
  const navigate = useNavigate();
  const { unreadCount } = useNotificationLog();
  const [langOpen, setLangOpen] = React.useState(false);
  // Reduce heavy effects when scrolled to avoid Android WebView repaint bugs
  const [isScrolled, setIsScrolled] = React.useState(false);
  const headerRef = React.useRef<HTMLElement | null>(null);
  const isTouch = React.useMemo(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || (navigator as any)?.maxTouchPoints > 0;
  }, []);

  React.useEffect(() => {
    const onScroll = () => {
      // Any scroll position past top switches the header to solid background
      setIsScrolled(window.scrollY > 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Measure header height and expose as CSS var for layout spacer
  React.useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const setVar = () => {
      const h = el.getBoundingClientRect().height || 56;
      document.documentElement.style.setProperty('--app-header-height', `${Math.round(h)}px`);
    };
    setVar();
    const ro = new ResizeObserver(() => setVar());
    ro.observe(el);
    window.addEventListener('orientationchange', setVar);
    window.addEventListener('resize', setVar);
    return () => {
      ro.disconnect();
      window.removeEventListener('orientationchange', setVar);
      window.removeEventListener('resize', setVar);
    };
  }, []);

  const handleLogout = async () => {
    await doSignOut();
    navigate('/auth');
  };

  // Simple admin detection via centralized helper
  const isAdminUser = React.useMemo(() => isAdminEmail(user?.email || undefined), [user?.email]);

  const languages = supportedLanguages;
  const handleThemeToggle = React.useCallback(() => {
    try {
      const root = document.documentElement;
      const isDark = root.classList.contains('dark');
      root.classList.remove('light', 'dark');
      root.classList.add(isDark ? 'light' : 'dark');
      try { localStorage.setItem('servyard-theme', isDark ? 'light' : 'dark'); } catch { }
    } catch { }
  }, []);
  // Native handler: ensure the theme toggle works even if React click is intercepted
  React.useEffect(() => {
    const btn = document.getElementById('header-theme-toggle');
    if (!btn) return;
    const onClick = () => handleThemeToggle();
    btn.addEventListener('click', onClick);
    return () => {
      btn.removeEventListener('click', onClick as EventListener);
    };
  }, [handleThemeToggle]);

  // Theme toggle handled by ThemeToggle component

  return (
    <header
      ref={headerRef}
      className={
        // Fixed header with high z-index; translucent only at very top
        `fixed top-0 z-[60] w-full border-b ${isScrolled ? 'bg-background shadow-sm' : 'bg-background/85 supports-[backdrop-filter]:backdrop-blur-md supports-[backdrop-filter]:backdrop-saturate-150'
        }`
      }
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="container mx-auto px-2 sm:px-4 py-0.5">
        {/* Stack layout: Logo on top, buttons below */}
        <div className="flex flex-col gap-0.5">
          {/* Top row: Menu Trigger & Logo */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            <SidebarTrigger 
              aria-label="Toggle sidebar" 
              className="ml-0 sm:ml-2 h-8 w-8 sm:h-10 sm:w-10 p-1.5 flex-shrink-0 border border-border/50 rounded-md hover:bg-accent [&>svg]:h-5 [&>svg]:w-5 sm:[&>svg]:h-6 sm:[&>svg]:w-6" 
            />
            <Link to="/" className="flex items-center leading-none min-w-0 overflow-hidden" aria-label="ServYard home">
              {/* Logo stays consistent - always visible */}
              <BrandLogo height={50} />
            </Link>
          </div>

          {/* Bottom row: Navigation Actions - perfectly aligned with consistent spacing */}
          <div className={`flex items-center justify-center gap-3 flex-shrink-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {/* 1. Notifications */}
            {isTouch ? (
              <Button
                variant="ghost"
                size="icon"
                className="relative h-10 w-10 p-0 flex items-center justify-center"
                asChild
              >
                <Link to="/notifications" aria-label={t.nav.notifications || 'Notifications'}>
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 rounded-full bg-red-600 text-white text-[10px] leading-none h-4 min-w-[16px] px-1 flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-10 w-10 p-0 flex items-center justify-center"
                    asChild
                  >
                    <Link to="/notifications" aria-label={t.nav.notifications || 'Notifications'}>
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 rounded-full bg-red-600 text-white text-[10px] leading-none h-4 min-w-[16px] px-1 flex items-center justify-center">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t.nav.notifications || 'Notifications'}</TooltipContent>
              </Tooltip>
            )}

            {/* 2. Location */}
            {isTouch ? (
              <Button
                aria-label={t.nav.location}
                variant="ghost"
                size="icon"
                onClick={onLocationChange}
                className="h-10 w-10 p-0 flex items-center justify-center"
              >
                <MapPin className="h-5 w-5" />
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label={t.nav.location}
                    variant="ghost"
                    size="icon"
                    onClick={onLocationChange}
                    className="h-10 w-10 p-0 flex items-center justify-center"
                  >
                    <MapPin className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t.nav.location}</TooltipContent>
              </Tooltip>
            )}

            {/* 3. Timezone */}
            {isTouch ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 p-0 flex items-center justify-center"
                asChild
              >
                <Link to="/timezone" aria-label={isRTL ? 'المنطقة الزمنية' : 'Timezone'}>
                  <Clock className="h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 p-0 flex items-center justify-center"
                    asChild
                  >
                    <Link to="/timezone" aria-label={isRTL ? 'المنطقة الزمنية' : 'Timezone'}>
                      <Clock className="h-5 w-5" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isRTL ? 'المنطقة الزمنية' : 'Timezone'}</TooltipContent>
              </Tooltip>
            )}

            {/* 4. Language */}
            <DropdownMenu open={langOpen} onOpenChange={setLangOpen}>
              {isTouch ? (
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 p-0 flex items-center justify-center" 
                    aria-label={t.nav.language}
                  >
                    <Globe className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 p-0 flex items-center justify-center" 
                        aria-label={t.nav.language}
                      >
                        <Globe className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>{t.nav.language}</TooltipContent>
                </Tooltip>
              )}
              <DropdownMenuContent
                align="end"
                side="bottom"
                sideOffset={8}
                collisionPadding={12}
                className="z-[70] w-64 max-h-[70vh] overflow-y-auto overscroll-contain rounded-xl bg-background border shadow-lg motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 duration-150"
                style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' as any }}
              >
                {languages.map((language) => (
                  <DropdownMenuItem
                    key={language.code}
                    onClick={() => {
                      setLangOpen(false);
                      if (language.code !== currentLanguage) {
                        setTimeout(() => onLanguageChange?.(language.code), 0);
                      }
                    }}
                    className={`${currentLanguage === language.code ? 'bg-accent' : ''}`}
                  >
                    <span className="break-words leading-tight">{language.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 5. Theme */}
            <Button
              id="header-theme-toggle"
              aria-label={t.nav.theme || 'Theme'}
              variant="ghost"
              size="icon"
              className="h-10 w-10 p-0 flex items-center justify-center"
            >
              <Sun className="h-5 w-5 dark:hidden" />
              <Moon className="hidden h-5 w-5 dark:block" />
              <span className="sr-only">{t.nav.theme || 'Theme'}</span>
            </Button>

            {/* 6. User Menu */}
            <DropdownMenu>
              {isTouch ? (
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 p-0 flex items-center justify-center" 
                    aria-label={user ? (role === 'provider' ? t.dashboard.providerDashboard : t.dashboard.customerDashboard) : t.nav.providerLogin}
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 p-0 flex items-center justify-center" 
                        aria-label={user ? (role === 'provider' ? t.dashboard.providerDashboard : t.dashboard.customerDashboard) : t.nav.providerLogin}
                      >
                        <User className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>{user ? (role === 'provider' ? t.dashboard.providerDashboard : t.dashboard.customerDashboard) : t.nav.providerLogin}</TooltipContent>
                </Tooltip>
              )}
              <DropdownMenuContent portalled={false} align="end" className="w-56 bg-background border shadow-lg z-[70] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 duration-150">
                {user ? (
                  <>
                    {isAdminUser && (
                      <DropdownMenuItem asChild>
                        <Link to="/console" className="flex items-center">
                          <Shield className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="break-words leading-tight">Admin Console</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {(role === 'provider' || role === 'customer') && (
                      <DropdownMenuItem asChild>
                        <Link to={role === 'provider' ? '/provider-dashboard' : '/customer-dashboard'} className="flex items-center">
                          <User className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="break-words leading-tight">{role === 'provider' ? t.dashboard.providerDashboard : t.dashboard.customerDashboard}</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="break-words leading-tight">{t.userInterface.logout}</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/auth" className="flex items-center">
                        <User className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="break-words leading-tight">{t.nav.providerLogin}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/auth" className="flex items-center">
                        <UserPlus className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="break-words leading-tight">{t.nav.customerLogin}</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};