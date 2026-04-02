import { supabase } from "@/integrations/supabase/client";

/**
 * Invoke a Supabase edge function with a longer timeout (default 120s).
 * The built-in supabase.functions.invoke has a short timeout that causes
 * image generation calls to fail.
 */
export async function invokeLongRunning(
  functionName: string,
  body: Record<string, unknown>,
  timeoutMs = 120_000
): Promise<{ data: any; error: any }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const session = (await supabase.auth.getSession()).data.session;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    const res = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${session?.access_token || anonKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const text = await res.text();
      let parsed: any;
      try { parsed = JSON.parse(text); } catch { parsed = { error: text }; }
      return { data: null, error: new Error(parsed.error || `HTTP ${res.status}`) };
    }

    const data = await res.json();
    return { data, error: null };
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      return { data: null, error: new Error("Request timed out — the AI is taking longer than usual. Please try again.") };
    }
    return { data: null, error: err };
  }
}
