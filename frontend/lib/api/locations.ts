import { get, post } from "./client";
import type {
  CreateLocationRequest,
  CreateLocationResponse,
  Location,
} from "./types";

/** Как приходит с gateway: вложенный объект `location` (camelCase). */
type LocationApiPayload = {
  id?: string | number;
  userId?: string;
  street?: string;
  city?: string;
  region?: string;
  latitude?: number | string;
  longitude?: number | string;
};

function normalizeLocation(raw: LocationApiPayload): Location {
  const lat =
    typeof raw.latitude === "number"
      ? raw.latitude
      : Number(String(raw.latitude ?? "").trim());
  const lng =
    typeof raw.longitude === "number"
      ? raw.longitude
      : Number(String(raw.longitude ?? "").trim());

  return {
    id: Number(raw.id) || 0,
    street: String(raw.street ?? ""),
    city: String(raw.city ?? ""),
    region: String(raw.region ?? ""),
    latitude: Number.isFinite(lat) ? lat : NaN,
    longitude: Number.isFinite(lng) ? lng : NaN,
  };
}

export function createLocation(
  data: CreateLocationRequest
): Promise<CreateLocationResponse> {
  return post<CreateLocationResponse>("/locations", data, { auth: true });
}

export function getLocation(id: number): Promise<Location> {
  return get<{ location?: LocationApiPayload }>(`/locations/${id}`, {
    auth: true,
  }).then((res) => normalizeLocation(res.location ?? {}));
}
