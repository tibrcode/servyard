import { CapacitorConfig } from "@capacitor/cli";

// Capacitor wrapper configuration for Android, iOS, and Web
// This does not modify your app code; it only defines how Capacitor wraps the Vite build output.
const config: CapacitorConfig = {
    appId: "com.servyard.app",
    appName: "ServYard",
    webDir: "dist",
    server: {
        // Keep default built-in file scheme for production builds.
        // For live reload in development, run with `cap run -l --external`.
        androidScheme: "http",
        iosScheme: "http",
        // url: "http://YOUR-LAN-IP:8080", // Optional: uncomment and set for manual live reload.
        // cleartext: true,
    },
    plugins: {
        SplashScreen: {
            launchShowDuration: 0,
        },
    },
};

export default config;
