import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { rtlLanguages as rtlBase } from "@/lib/languages";

// Lightweight boot diagnostics for Android WebView
try {
    // Apply initial theme and language BEFORE React mounts to avoid FOUC
    try {
        const root = document.documentElement;
        // Theme: default to dark only if no saved preference exists
        const savedTheme = localStorage.getItem('servyard-theme');
        const theme = savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark';
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        if (!savedTheme) localStorage.setItem('servyard-theme', theme);

        // Language: default to English on first run, persist thereafter
        const savedLang = localStorage.getItem('preferred-language');
        const lang = savedLang || 'en';
        if (!savedLang) localStorage.setItem('preferred-language', lang);
        // Basic dir/lang application to reduce initial flicker
        const isRTL = Array.isArray(rtlBase) && rtlBase.includes(lang);
        root.lang = lang;
        root.dir = isRTL ? 'rtl' : 'ltr';
    } catch { /* noop */ }
    // Global error hooks to surface issues in logcat (chromium CONSOLE)
    window.addEventListener("error", (e) => {
        // eslint-disable-next-line no-console
        console.error("[BOOT] window.error:", e.error || e.message || e);
    });
    window.addEventListener("unhandledrejection", (e: PromiseRejectionEvent) => {
        // eslint-disable-next-line no-console
        console.error("[BOOT] unhandledrejection:", e.reason);
    });

    const rootEl = document.getElementById("root");
    if (rootEl) {
        // Visual heartbeat in case React fails to mount
        rootEl.textContent = "Booting…";
    }
    // eslint-disable-next-line no-console
    console.log("[BOOT] main.tsx loaded at", new Date().toISOString());

    createRoot(rootEl!).render(<App />);
} catch (err) {
    // eslint-disable-next-line no-console
    console.error("[BOOT] render failed:", err);
}
