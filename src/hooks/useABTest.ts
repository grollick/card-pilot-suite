import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ABTestVariant {
  id: string;
  test_id: string;
  variant_key: string;
  headline: string | null;
  subheadline: string | null;
  cta_text: string | null;
  hero_visual_url: string | null;
  weight: number;
  views: number;
  clicks: number;
  signups: number;
}

interface ABTest {
  id: string;
  name: string;
  status: string;
  section: string;
}

function getSessionId(): string {
  const key = "guzzl_ab_session";
  let sid = sessionStorage.getItem(key);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(key, sid);
  }
  return sid;
}

function getStoredVariant(testId: string): string | null {
  return sessionStorage.getItem(`guzzl_ab_${testId}`);
}

function storeVariant(testId: string, variantId: string) {
  sessionStorage.setItem(`guzzl_ab_${testId}`, variantId);
}

function pickVariant(variants: ABTestVariant[]): ABTestVariant {
  const totalWeight = variants.reduce((s, v) => s + v.weight, 0);
  let r = Math.random() * totalWeight;
  for (const v of variants) {
    r -= v.weight;
    if (r <= 0) return v;
  }
  return variants[0];
}

export function useABTest(section: string = "hero") {
  const viewTracked = useRef(false);

  const { data: testData } = useQuery({
    queryKey: ["ab-test", section],
    queryFn: async () => {
      const { data: tests } = await (supabase as any)
        .from("ab_tests")
        .select("*")
        .eq("section", section)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      if (!tests) return null;

      const { data: variants } = await (supabase as any)
        .from("ab_test_variants")
        .select("*")
        .eq("test_id", tests.id);

      return { test: tests as ABTest, variants: (variants || []) as ABTestVariant[] };
    },
    staleTime: 5 * 60 * 1000,
  });

  const activeVariant = useMemo(() => {
    if (!testData || testData.variants.length === 0) return null;

    const stored = getStoredVariant(testData.test.id);
    if (stored) {
      const found = testData.variants.find((v) => v.id === stored);
      if (found) return found;
    }

    const picked = pickVariant(testData.variants);
    storeVariant(testData.test.id, picked.id);
    return picked;
  }, [testData]);

  // Track view once per session
  useEffect(() => {
    if (!activeVariant || !testData || viewTracked.current) return;
    viewTracked.current = true;

    const sessionId = getSessionId();
    (supabase as any).from("ab_test_events").insert({
      test_id: testData.test.id,
      variant_id: activeVariant.id,
      event_type: "view",
      session_id: sessionId,
    }).then(() => {});

    (supabase as any).rpc("increment_ab_variant_counter", {
      p_variant_id: activeVariant.id,
      p_counter: "views",
    }).then(() => {});
  }, [activeVariant, testData]);

  const trackClick = () => {
    if (!activeVariant || !testData) return;
    const sessionId = getSessionId();
    (supabase as any).from("ab_test_events").insert({
      test_id: testData.test.id,
      variant_id: activeVariant.id,
      event_type: "click",
      session_id: sessionId,
    }).then(() => {});
    (supabase as any).rpc("increment_ab_variant_counter", {
      p_variant_id: activeVariant.id,
      p_counter: "clicks",
    }).then(() => {});
  };

  const trackSignup = () => {
    if (!activeVariant || !testData) return;
    const sessionId = getSessionId();
    (supabase as any).from("ab_test_events").insert({
      test_id: testData.test.id,
      variant_id: activeVariant.id,
      event_type: "signup",
      session_id: sessionId,
    }).then(() => {});
    (supabase as any).rpc("increment_ab_variant_counter", {
      p_variant_id: activeVariant.id,
      p_counter: "signups",
    }).then(() => {});
  };

  return {
    variant: activeVariant,
    test: testData?.test ?? null,
    trackClick,
    trackSignup,
    hasTest: !!testData && testData.variants.length > 0,
  };
}

// Hook for admin dashboard
export function useABTests() {
  return useQuery({
    queryKey: ["ab-tests-admin"],
    queryFn: async () => {
      const { data: tests, error } = await (supabase as any)
        .from("ab_tests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (tests || []) as (ABTest & { winner_variant_id: string | null; description: string | null; created_at: string })[];
    },
  });
}

export function useABTestVariants(testId: string | undefined) {
  return useQuery({
    queryKey: ["ab-test-variants", testId],
    enabled: !!testId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("ab_test_variants")
        .select("*")
        .eq("test_id", testId)
        .order("created_at");
      if (error) throw error;
      return (data || []) as ABTestVariant[];
    },
  });
}
