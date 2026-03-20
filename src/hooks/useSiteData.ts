import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SiteData {
  profile: {
    id: string;
    name: string | null;
    handle: string | null;
    email: string | null;
    phone: string | null;
    company: string | null;
    avatar_url: string | null;
    bio: string | null;
    city: string | null;
    profession_name: string | null;
    profession_category: string | null;
  };
  card: {
    sections_json: any;
    theme_json: any;
  } | null;
  services: { id: string; name: string; price: number | null; duration_min: number; description: string | null }[];
  aiContent: Record<string, any> | null;
}

export function useSiteData(handle: string | undefined) {
  return useQuery({
    queryKey: ["site-data", handle],
    enabled: !!handle,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<SiteData> => {
      const { data: profile, error: pErr } = await supabase
        .from("public_profiles" as any)
        .select("id, name, handle, company, avatar_url, bio, city, profession_id")
        .eq("handle", handle!)
        .single();
      if (pErr) throw pErr;

      const [cardResult, servicesResult] = await Promise.all([
        supabase
          .from("cards")
          .select("sections_json, theme_json")
          .eq("user_id", profile.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("booking_services")
          .select("id, name, price, duration_min, description")
          .eq("user_id", profile.id)
          .eq("active", true)
          .order("name"),
      ]);

      // Extract card section content
      const sectionsRaw = cardResult.data?.sections_json;
      const sections: any[] = Array.isArray(sectionsRaw) ? sectionsRaw : [];
      const aboutSection = sections.find((s: any) => s.id === "about");
      const testimonialsSection = sections.find((s: any) => s.id === "testimonials");

      return {
        profile: {
          ...profile,
          bio: (profile as any).bio ?? aboutSection?.content?.text ?? null,
          city: (profile as any).city ?? null,
          profession_name: (profile as any).professions?.name ?? null,
          profession_category: (profile as any).professions?.category ?? null,
        },
        card: cardResult.data,
        services: servicesResult.data ?? [],
        aiContent: {
          about: aboutSection?.content ?? null,
          testimonials: testimonialsSection?.content?.testimonials ?? testimonialsSection?.content ?? null,
        },
      };
    },
  });
}
