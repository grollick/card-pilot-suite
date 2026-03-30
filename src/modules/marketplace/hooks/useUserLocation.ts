import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "guzzl_user_location";
const DEFAULT_CITY = "Thunder Bay";
const DEFAULT_REGION = "ON";

export interface UserLocation {
  city: string;
  region: string;
  lat: number | null;
  lon: number | null;
  source: "gps" | "saved" | "manual" | "default";
}

function getSavedLocation(): UserLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveLocation(loc: UserLocation) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  } catch {}
}

export function useUserLocation() {
  const [location, setLocationState] = useState<UserLocation>(
    () => getSavedLocation() || { city: DEFAULT_CITY, region: DEFAULT_REGION, lat: null, lon: null, source: "default" }
  );
  const [detecting, setDetecting] = useState(false);

  const setLocation = useCallback((city: string, region: string, lat: number | null = null, lon: number | null = null, source: UserLocation["source"] = "manual") => {
    const loc: UserLocation = { city, region, lat, lon, source };
    setLocationState(loc);
    saveLocation(loc);
  }, []);

  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
      });
      const { latitude, longitude } = pos.coords;

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10`,
        { headers: { "Accept-Language": "en" } }
      );
      if (res.ok) {
        const data = await res.json();
        const city = data.address?.city || data.address?.town || data.address?.village || DEFAULT_CITY;
        const region = data.address?.state_code?.toUpperCase() || data.address?.state || DEFAULT_REGION;
        setLocation(city, region, latitude, longitude, "gps");
      }
    } catch {
      // GPS denied or failed
    } finally {
      setDetecting(false);
    }
  }, [setLocation]);

  useEffect(() => {
    if (location.source === "default") {
      detectLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { location, setLocation, detectLocation, detecting };
}
