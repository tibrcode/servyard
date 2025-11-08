import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { rtlLanguages as rtlBase } from "@/lib/languages";
import { registerFirebaseMessagingSW } from "@/lib/firebase/sw";
import { collectWebVitals, logVital } from "@/lib/monitoring/vitals";
import ErrorBoundary from './components/common/ErrorBoundary';

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
        console.error("[BOOT] window.error:", e.error || e.message || e);
    });
    window.addEventListener("unhandledrejection", (e: PromiseRejectionEvent) => {
        console.error("[BOOT] unhandledrejection:", e.reason);
    });

    const rootEl = document.getElementById("root");
    if (rootEl) {
        // Visual heartbeat in case React fails to mount
        rootEl.textContent = "Booting…";
    }
    console.log("[BOOT] main.tsx loaded at", new Date().toISOString());

    // Proactively register the Firebase Messaging service worker so background notifications work
    try {
        registerFirebaseMessagingSW().then((reg) => {
            if (reg) {
                console.log("[BOOT] FCM Service Worker registered:", reg.scope);
            } else {
                console.warn("[BOOT] FCM Service Worker not registered (unsupported or failed)");
            }
        });
    } catch (e) {
        console.warn("[BOOT] SW registration error:", e);
    }

    createRoot(rootEl!).render(
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    );

    // Start collecting Web Vitals with sampling (10%) to limit write costs
    try {
        const sample = Math.random() < 0.1;
        if (sample) {
            collectWebVitals((m) => {
                // Console for local insight
                console.log('[Vitals]', m.name, m.value);
                // Non-blocking async log
                logVital(m);
            });
        }
    } catch (e) {
        console.warn('[BOOT] Web Vitals init failed', e);
    }
} catch (err) {
    console.error("[BOOT] render failed:", err);
}
