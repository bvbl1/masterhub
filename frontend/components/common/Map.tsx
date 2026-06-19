"use client";

import { GoogleMap, Marker } from "@react-google-maps/api";
import { useCallback, useEffect, useState } from "react";
import { useGoogleMaps } from "@/components/providers/GoogleMapsProvider";

const defaultMapHeightPx = 500;

/** Центр по умолчанию — Астана */
const defaultCenter = {
  lat: 51.1694,
  lng: 71.4491,
};

export type MapResolvedPlace = {
  street: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  formattedAddress: string;
};

type MapPickerProps = {
  /** Вызывается после геокодирования точки клика — для заполнения полей формы */
  onPlaceResolved?: (place: MapResolvedPlace) => void;
  /** Высота карты в px (по умолчанию 500; в модалках удобнее 260–320). */
  mapHeightPx?: number;
};

function pickComponent(
  components: google.maps.GeocoderAddressComponent[],
  ...types: string[]
): string | undefined {
  for (const t of types) {
    const c = components.find((x) => x.types.includes(t));
    if (c?.long_name?.trim()) return c.long_name.trim();
  }
  return undefined;
}

function normalizeLoose(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-zа-яё0-9]/gi, "");
}

/**
 * Разбор результата Geocoder в street / city / region (по типам Google).
 */
export function parseGeocoderResult(
  result: google.maps.GeocoderResult,
): Omit<MapResolvedPlace, "latitude" | "longitude"> {
  const c = result.address_components ?? [];
  const formatted = result.formatted_address ?? "";

  const streetNumber = pickComponent(c, "street_number") ?? "";
  const route = pickComponent(c, "route") ?? "";
  const premise =
    pickComponent(c, "premise", "establishment", "point_of_interest") ?? "";

  let street = [route, streetNumber].filter(Boolean).join(" ").trim();
  if (!street && premise) street = premise;
  if (!street && formatted) {
    street = formatted.split(",")[0]?.trim() ?? "";
  }

  const locality = pickComponent(
    c,
    "locality",
    "postal_town",
    "sublocality_level_1",
    "sublocality",
  );
  const admin1 = pickComponent(c, "administrative_area_level_1");
  const admin2 = pickComponent(c, "administrative_area_level_2");
  const country = pickComponent(c, "country") ?? "";

  let city = locality ?? "";
  let region = "";

  if (
    locality &&
    admin1 &&
    normalizeLoose(locality) !== normalizeLoose(admin1)
  ) {
    city = locality;
    region = admin1;
  } else if (locality) {
    city = locality;
    region = admin2 || country || admin1 || "";
  } else if (admin1) {
    city = admin1;
    region = admin2 || country || "";
  } else {
    region = admin2 || country;
  }

  if (!city && formatted) {
    const parts = formatted.split(",").map((s) => s.trim());
    if (parts[1]) city = parts[1].replace(/\s*\d{4,}\s*$/, "").trim();
  }

  if (!region) region = country || admin1 || admin2 || "";
  if (!city) city = region || formatted.split(",")[0]?.trim() || "";

  return {
    street: street || formatted,
    city,
    region,
    formattedAddress: formatted,
  };
}

function MapLoadingPlaceholder({
  mapHeightPx,
  className = "",
}: {
  mapHeightPx: number;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-slate-50 animate-pulse ${className}`}
      style={{ width: "100%", height: `${mapHeightPx}px` }}
    />
  );
}

function MissingApiKeyNotice({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 ${className}`}
    >
      Map unavailable — set{" "}
      <code className="font-mono text-xs">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>
    </div>
  );
}

type MapCityPreviewProps = {
  city: string;
  mapHeightPx?: number;
  className?: string;
};

/** Read-only map centered on a city (job request area). */
export function MapCityPreview({
  city,
  mapHeightPx = 240,
  className = "",
}: MapCityPreviewProps) {
  const { apiKey, isLoaded } = useGoogleMaps();
  const [center, setCenter] = useState(defaultCenter);
  const [label, setLabel] = useState("");

  const geocodeCity = useCallback(() => {
    const q = city.trim();
    if (!q || typeof window === "undefined" || !window.google?.maps) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode(
      { address: q.includes(",") ? q : `${q}, Kazakhstan` },
      (results, status) => {
        if (status !== "OK" || !results?.[0]?.geometry?.location) return;
        const loc = results[0].geometry.location;
        setCenter({ lat: loc.lat(), lng: loc.lng() });
        setLabel(results[0].formatted_address ?? q);
      },
    );
  }, [city]);

  useEffect(() => {
    setLabel("");
    setCenter(defaultCenter);
    if (isLoaded && window.google?.maps) {
      geocodeCity();
    }
  }, [city, geocodeCity, isLoaded]);

  if (!apiKey) {
    return <MissingApiKeyNotice className={className} />;
  }

  if (!isLoaded) {
    return (
      <MapLoadingPlaceholder mapHeightPx={mapHeightPx} className={className} />
    );
  }

  return (
    <div className={className}>
      <GoogleMap
        mapContainerStyle={{
          width: "100%",
          height: `${mapHeightPx}px`,
        }}
        center={center}
        zoom={11}
        onLoad={geocodeCity}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        <Marker position={center} />
      </GoogleMap>
      {label ? <p className="mt-2 text-xs text-slate-500">{label}</p> : null}
    </div>
  );
}

export default function MapPicker({
  onPlaceResolved,
  mapHeightPx = defaultMapHeightPx,
}: MapPickerProps) {
  const { apiKey, isLoaded } = useGoogleMaps();
  const containerStyle = {
    width: "100%",
    height: `${mapHeightPx}px`,
  };
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [geoError, setGeoError] = useState<string | null>(null);

  const handleClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng || !window.google?.maps) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      setPosition({ lat, lng });
      setGeoError(null);

      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status !== "OK" || !results?.[0]) {
          setGeoError("Could not resolve address for this point.");
          return;
        }

        const r = results[0];
        const parsed = parseGeocoderResult(r);
        onPlaceResolved?.({
          ...parsed,
          latitude: lat,
          longitude: lng,
        });
      });
    },
    [onPlaceResolved],
  );

  if (!apiKey) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Set <code className="font-mono">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>{" "}
        to use the map and auto-fill the address.
      </div>
    );
  }

  if (!isLoaded) {
    return <MapLoadingPlaceholder mapHeightPx={mapHeightPx} />;
  }

  return (
    <div>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={12}
        onClick={handleClick}
      >
        {position ? <Marker position={position} /> : null}
      </GoogleMap>

      {geoError ? (
        <p className="mt-2 text-sm text-red-600">{geoError}</p>
      ) : null}
    </div>
  );
}
