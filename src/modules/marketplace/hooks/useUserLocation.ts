import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "guzzl_user_location";
const DEFAULT_CITY = "Thunder Bay";
const DEFAULT_REGION = "ON";

export interface UserLocation {
  city: string;
  region: string;
  source: "gps" | "saved" | "manual" | "default";
}

function getSavedLocation(): UserLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    return null;
  }
  return null;
}

function saveLocation(loc: UserLocation) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  } catch (e) {
    console.error("Failed to save location", e);
  }
}

export function useUserLocation() {
  const [location, setLocationState] = useState<UserLocation>(
    () => getSavedLocation() || { city: DEFAULT_CITY, region: DEFAULT_REGION, source: "default" }
  );
  const [detecting, setDetecting] = useState(false);

  const setLocation = useCallback((city: string, region: string, source: UserLocation["source"] = "manual") => {
    const loc: UserLocation = { city, region, source };
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
      
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&zoom=10`,
        { headers: { "Accept-Language": "en" } }
      );
      
      if (res.ok) {
        const data = await res.json();
        const city = data.address?.city || data.address?.town || data.address?.village || DEFAULT_CITY;
        const region = data.address?.state_code?.toUpperCase() || data.address?.state || DEFAULT_REGION;
        setLocation(city, region, "gps");
      }
    } catch (e) {
      console.error("Geolocation failed", e);
    } finally {
      setDetecting(false);
    }
  }, [setLocation]);

  useEffect(() => {
    if (location.source === "default") {
      detectLocation();
    }
  }, [detectLocation, location.source]);

  return { location, setLocation, detectLocation, detecting };
}
