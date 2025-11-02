import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Globe, MapPin, User, UserPlus, LogOut, Sun, Moon, Shield } from "lucide-react";
import { useTranslation, supportedLanguages } from "@/lib/i18n";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Link, useNavigate } from "react-router-dom";
import BrandLogo from "@/components/BrandLogo";
import { useAuth } from "@/contexts/AuthContext";

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

  // Simple admin detection (matches AdminConsole guard): company domains or specific admin email
  const isAdminUser = React.useMemo(() => {
    const email = (user?.email || '').toLowerCase();
    return (
      email === 'admin@servyard.com' ||
      /@(tibrcode\.com|servyard\.com|serv-yard\.com)$/i.test(email)
    );
  }, [user?.email]);

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
      <div className="container mx-auto px-2 sm:px-4 py-0">
        <div className="flex items-center justify-between min-h-12 gap-2 flex-nowrap w-full overflow-x-hidden">
          {/* Menu Trigger & Logo */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <SidebarTrigger aria-label="Toggle sidebar" className="ml-1 sm:ml-2 h-10 w-10 sm:h-12 sm:w-12 p-0 flex-shrink-0 [&>svg]:h-8 [&>svg]:w-8 sm:[&>svg]:h-10 sm:[&>svg]:w-10" />
            <Link to="/" className="flex items-center leading-none min-w-0 overflow-hidden" aria-label="ServYard home">
              {/* Responsive logo sizes to keep everything on a single row on small screens */}
              <span className="sm:hidden block"><BrandLogo height={40} /></span>
              <span className="hidden sm:inline md:hidden"><BrandLogo height={48} /></span>
              <span className="hidden md:inline-block"><BrandLogo height={80} /></span>
            </Link>
          </div>

          {/* Navigation Actions */}
          <div className={`ml-auto flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0 isolate whitespace-nowrap flex-nowrap max-w-full ${isRTL ? 'flex-row-reverse' : ''}`}>
            {/* Location (icon-only with tooltip) */}
            {isTouch ? (
              <Button
                aria-label={t.nav.location}
                variant="ghost"
                size="icon"
                onClick={onLocationChange}
                className="inline-flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 p-0 transition-transform active:scale-95"
              >
                <MapPin className="block h-8 w-8 sm:h-10 sm:w-10" />
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label={t.nav.location}
                    variant="ghost"
                    size="icon"
                    onClick={onLocationChange}
                    className="inline-flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 p-0 transition-transform active:scale-95"
                  >
                    <MapPin className="block h-8 w-8 sm:h-10 sm:w-10" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t.nav.location}</TooltipContent>
              </Tooltip>
            )}

            {/* Language Selector */}
            <DropdownMenu open={langOpen} onOpenChange={setLangOpen}>
              {isTouch ? (
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="inline-flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 p-0 transition-transform active:scale-95" aria-label={t.nav.language}>
                    <Globe className="block h-8 w-8 sm:h-10 sm:w-10" />
                  </Button>
                </DropdownMenuTrigger>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="inline-flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 p-0 transition-transform active:scale-95" aria-label={t.nav.language}>
                        <Globe className="block h-8 w-8 sm:h-10 sm:w-10" />
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
                    className={`flex items-center gap-3 ${currentLanguage === language.code ? 'bg-accent' : ''}`}
                  >
                    <span className="text-base flex-shrink-0">{language.flag}</span>
                    <span className="break-words leading-tight">{language.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle (Button structure unified with other icons for perfect alignment) */}
            <Button
              id="header-theme-toggle"
              aria-label={t.nav.theme || 'Theme'}
              variant="ghost"
              size="icon"
              className="inline-flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 p-0 transition-transform active:scale-95"
            >
              {/* Match icon box sizing to others */}
              <Sun className="block h-8 w-8 sm:h-10 sm:w-10 dark:hidden" strokeWidth={2} />
              <Moon className="hidden h-8 w-8 sm:h-10 sm:w-10 dark:block" strokeWidth={2} />
              <span className="sr-only">{t.nav.theme || 'Theme'}</span>
            </Button>

            {/* Auth / User Area */}
            {/* Unified User Menu (all breakpoints) */}
            <DropdownMenu>
              {isTouch ? (
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="inline-flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 p-0 transition-transform active:scale-95" aria-label={user ? (role === 'provider' ? t.dashboard.providerDashboard : t.dashboard.customerDashboard) : t.nav.providerLogin}>
                    <User className="block h-8 w-8 sm:h-10 sm:w-10" />
                  </Button>
                </DropdownMenuTrigger>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="inline-flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 p-0 transition-transform active:scale-95" aria-label={user ? (role === 'provider' ? t.dashboard.providerDashboard : t.dashboard.customerDashboard) : t.nav.providerLogin}>
                        <User className="block h-8 w-8 sm:h-10 sm:w-10" />
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