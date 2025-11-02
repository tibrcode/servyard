import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // For web/Vercel builds use absolute base "/" so deep links like /console load assets correctly.
  // Keep "app" mode (for Capacitor) using relative base "./" to support file://.
  base: mode === "app" ? "./" : "/",
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
}));
