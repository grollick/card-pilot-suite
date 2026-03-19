import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

export interface OnDutyProfessional {
  id: string;
  name: string;
  handle: string;
  avatar_url: string | null;
  company: string | null;
  city: string | null;
  profession_name: string | null;
  service_area: string | null;
  avg_rating: number | null;
  review_count: number;
  avg_response_minutes: number | null;
  status: "available" | "recent" | "offline";
  went_on_duty_at: string | null;
  badges: string[];
  lat: number;
  lng: number;
}

// Approximate geocoding from city name — deterministic hash-based offset from a base
function cityToCoords(city: string | null, userId: string): { lat: number; lng: number } | null {
  if (!city) return null;
  // Simple hash for consistent offset per user
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash |= 0;
  }
  // Base coords for common cities (very rough), otherwise use generic US center
  const cityLower = city.toLowerCase().trim();
  const cityBases: Record<string, [number, number]> = {
    "new york": [40.7128, -74.006],
    "los angeles": [34.0522, -118.2437],
    "chicago": [41.8781, -87.6298],
    "houston": [29.7604, -95.3698],
    "miami": [25.7617, -80.1918],
    "dallas": [32.7767, -96.797],
    "atlanta": [33.749, -84.388],
    "denver": [39.7392, -104.9903],
    "seattle": [47.6062, -122.3321],
    "san francisco": [37.7749, -122.4194],
    "boston": [42.3601, -71.0589],
    "phoenix": [33.4484, -112.074],
    "toronto": [43.6532, -79.3832],
    "london": [51.5074, -0.1278],
  };
  const base = Object.entries(cityBases).find(([k]) => cityLower.includes(k))?.[1] ?? [39.8283, -98.5795];
  // Add small random-looking offset (±0.05 degrees ≈ 3-5 km)
  const latOffset = ((hash % 100) - 50) * 0.001;
  const lngOffset = (((hash >> 8) % 100) - 50) * 0.001;
  return { lat: base[0] + latOffset, lng: base[1] + lngOffset };
}

export function useUserLocation() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      () => {
        setError("Location access denied");
        setLoading(false);
      },
      { timeout: 8000 }
    );
  }, []);

  return { location, loading, error };
}

export function useOnDutyProfessionals() {
  return useQuery({
    queryKey: ["on-duty-map"],
    staleTime: 60_000,
    queryFn: async (): Promise<OnDutyProfessional[]> => {
      // Get all marketplace-enabled profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, handle, avatar_url, company, city, bio, service_area, available_for_work, avg_response_minutes, marketplace_enabled, professions(name)" as any)
        .not("handle", "is", null)
        .not("name", "is", null);

      const enabled = (profiles ?? []).filter((p: any) => p.marketplace_enabled);
      if (enabled.length === 0) return [];

      const userIds = enabled.map((p: any) => p.id);

      const [dutyRes, ratingsRes] = await Promise.all([
        supabase
          .from("estimate_duty_status")
          .select("user_id, is_on_duty, went_on_duty_at, updated_at")
          .in("user_id", userIds),
        supabase
          .from("reviews")
          .select("user_id, rating")
          .eq("is_public", true)
          .in("user_id", userIds),
      ]);

      const dutyMap = new Map<string, any>();
      (dutyRes.data ?? []).forEach((d: any) => dutyMap.set(d.user_id, d));

      const ratingsMap: Record<string, { avg: number; count: number }> = {};
      const grouped: Record<string, number[]> = {};
      (ratingsRes.data ?? []).forEach((r: any) => {
        if (!grouped[r.user_id]) grouped[r.user_id] = [];
        grouped[r.user_id].push(r.rating);
      });
      for (const [uid, ratings] of Object.entries(grouped)) {
        const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        ratingsMap[uid] = { avg: Math.round(avg * 10) / 10, count: ratings.length };
      }

      const now = Date.now();
      const twoHoursMs = 2 * 60 * 60 * 1000;

      return enabled
        .map((p: any) => {
          const duty = dutyMap.get(p.id);
          const coords = cityToCoords(p.city, p.id);
          if (!coords) return null;

          let status: "available" | "recent" | "offline" = "offline";
          if (duty?.is_on_duty) {
            status = "available";
          } else if (duty?.updated_at && now - new Date(duty.updated_at).getTime() < twoHoursMs) {
            status = "recent";
          } else if (p.available_for_work) {
            status = "offline";
          }

          // Only show available and recent on the map
          if (status === "offline") return null;

          const badges: string[] = [];
          const respMin = p.avg_response_minutes;
          if (respMin && respMin < 30) badges.push("Fast Responder");
          const rd = ratingsMap[p.id];
          if (rd && rd.avg >= 4.5 && rd.count >= 3) badges.push("Highly Rated");
          if (duty?.is_on_duty) badges.push("On Duty");

          return {
            id: p.id,
            name: p.name,
            handle: p.handle,
            avatar_url: p.avatar_url,
            company: p.company,
            city: p.city,
            profession_name: p.professions?.name ?? null,
            service_area: p.service_area,
            avg_rating: rd?.avg ?? null,
            review_count: rd?.count ?? 0,
            avg_response_minutes: respMin ?? null,
            status,
            went_on_duty_at: duty?.went_on_duty_at ?? null,
            badges,
            lat: coords.lat,
            lng: coords.lng,
          } satisfies OnDutyProfessional;
        })
        .filter(Boolean) as OnDutyProfessional[];
    },
  });
}
