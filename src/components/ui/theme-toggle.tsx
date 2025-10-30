import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

type ThemeMode = "light" | "dark";

// A resilient theme toggle that
// - forwards refs and props (to work with Radix Tooltip asChild)
// - initializes from current document state or saved preference
// - persists the choice in localStorage
export const ThemeToggle = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, "aria-label": ariaLabel, onClick, ...props }, ref) => {
    const [theme, setTheme] = React.useState<ThemeMode>(() => {
      try {
        // Prefer explicit saved preference
        const saved = localStorage.getItem("servyard-theme");
        if (saved === "light" || saved === "dark") return saved;
      } catch { }
      // Fallback to current document state
      if (typeof document !== "undefined") {
        return document.documentElement.classList.contains("dark") ? "dark" : "light";
      }
      return "light";
    });

    // Apply theme to <html> and persist
    React.useEffect(() => {
      try {
        const root = document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(theme);
        localStorage.setItem("servyard-theme", theme);
      } catch { }
    }, [theme]);

    // Toggle by reading the real current root class to avoid desync with sidebar
    const doToggle = () => {
      try {
        const root = document.documentElement;
        const isDark = root.classList.contains("dark");
        const next: ThemeMode = isDark ? "light" : "dark";
        setTheme(next);
      } catch {
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
      }
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // First allow external handler to run; if it prevents default, skip internal toggle
      onClick?.(e as any);
      if (e.defaultPrevented) return;
      try {
        const root = document.documentElement;
        const isDark = root.classList.contains("dark");
        const next: ThemeMode = isDark ? "light" : "dark";
        root.classList.remove("light", "dark");
        root.classList.add(next);
        try { localStorage.setItem("servyard-theme", next); } catch { }
        setTheme(next);
      } catch {
        doToggle();
      }
    };

    // Keep internal state in sync if something else (e.g., sidebar) changes the class
    React.useEffect(() => {
      try {
        const root = document.documentElement;
        const updateFromDom = () => {
          const isDark = root.classList.contains("dark");
          setTheme(isDark ? "dark" : "light");
        };
        const mo = new MutationObserver((mutations) => {
          for (const m of mutations) {
            if (m.type === "attributes" && m.attributeName === "class") {
              updateFromDom();
            }
          }
        });
        mo.observe(root, { attributes: true, attributeFilter: ["class"] });
        // Initialize once
        updateFromDom();
        return () => mo.disconnect();
      } catch { }
    }, []);

    return (
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        onClick={handleClick}
        className={["relative inline-flex items-center justify-center h-12 w-12 p-0 leading-none", className].filter(Boolean).join(" ")}
        aria-label={ariaLabel || "Toggle theme"}
        {...props}
      >
        <Sun className="absolute inset-0 m-auto h-10 w-10 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 pointer-events-none" />
        <Moon className="absolute inset-0 m-auto h-10 w-10 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 pointer-events-none" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  },
);

ThemeToggle.displayName = "ThemeToggle";