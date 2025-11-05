/**
 * Type declarations for Google Maps JavaScript API
 * This provides TypeScript support for Google Maps components
 */

declare global {
  interface Window {
    google: typeof google;
  }
}

declare namespace google {
  namespace maps {
    export class Map {
      constructor(mapDiv: HTMLElement, opts?: MapOptions);
      addListener(eventName: string, handler: Function): void;
      setCenter(latlng: LatLng | LatLngLiteral): void;
      setZoom(zoom: number): void;
    }

    export class Marker {
      constructor(opts?: MarkerOptions);
      setMap(map: Map | null): void;
      getPosition(): LatLng | null;
      addListener(eventName: string, handler: Function): void;
    }

    export class InfoWindow {
      constructor(opts?: InfoWindowOptions);
      open(map?: Map, anchor?: Marker): void;
      close(): void;
      setContent(content: string | HTMLElement): void;
    }

    export class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }

    export enum Animation {
      DROP = 1,
      BOUNCE = 2
    }

    export interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
      mapTypeId?: string;
      disableDefaultUI?: boolean;
      zoomControl?: boolean;
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
      fullscreenControl?: boolean;
    }

    export interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    export interface MarkerOptions {
      position?: LatLng | LatLngLiteral;
      map?: Map;
      title?: string;
      label?: string;
      draggable?: boolean;
      animation?: Animation;
    }

    export interface InfoWindowOptions {
      content?: string | HTMLElement;
    }

    export interface MapMouseEvent {
      latLng: LatLng | null;
    }

    namespace places {
      export class Autocomplete {
        constructor(input: HTMLInputElement, opts?: AutocompleteOptions);
        addListener(eventName: string, handler: Function): void;
        getPlace(): PlaceResult;
      }

      export interface AutocompleteOptions {
        types?: string[];
        fields?: string[];
      }

      export interface PlaceResult {
        formatted_address?: string;
        geometry?: {
          location?: LatLng;
        };
        address_components?: AddressComponent[];
      }

      export interface AddressComponent {
        long_name: string;
        short_name: string;
        types: string[];
      }
    }
  }
}

export {};
