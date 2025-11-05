/// <reference types="vite/client" />
/// <reference types="./types/google-maps" />

interface Window {
  google: typeof google;
  googleMapsLoaded?: boolean;
  initGoogleMaps?: () => void;
  GOOGLE_MAPS_API_KEY?: string;
}
