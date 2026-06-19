"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useJsApiLoader } from "@react-google-maps/api";

const GOOGLE_MAPS_SCRIPT_ID = "masterhub-google-maps";

type GoogleMapsContextValue = {
  apiKey: string;
  isLoaded: boolean;
  loadError: Error | undefined;
};

const GoogleMapsContext = createContext<GoogleMapsContextValue>({
  apiKey: "",
  isLoaded: false,
  loadError: undefined,
});

export function GoogleMapsProvider({ children }: { children: ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";

  const { isLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAPS_SCRIPT_ID,
    googleMapsApiKey: apiKey,
    preventGoogleFontsLoading: true,
  });

  return (
    <GoogleMapsContext.Provider
      value={{
        apiKey,
        isLoaded: Boolean(apiKey) && isLoaded,
        loadError,
      }}
    >
      {children}
    </GoogleMapsContext.Provider>
  );
}

export function useGoogleMaps() {
  return useContext(GoogleMapsContext);
}
