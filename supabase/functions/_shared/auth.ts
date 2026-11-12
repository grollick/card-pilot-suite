import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/** True when the caller presents the project's service key (cron / internal callers). */
export function isServiceCall(req: Request): boolean {
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) return false;
  const bearer = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  return bearer === key || req.headers.get("x-internal-service-key") === key;
}

/** Returns the signed-in user's id, or null when the request has no valid user session. */
export async function getUserId(req: Request): Promise<string | null> {
  const auth = req.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub as string;
}

export function unauthorized(cors: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

/** Keep only user/assistant chat turns with string content, capped in count and length. */
export function sanitizeChatMessages(input: unknown, maxMessages = 30, maxChars = 4000) {
  if (!Array.isArray(input)) return [];
  return input
    .filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-maxMessages)
    .map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content.slice(0, maxChars) }));
}

/** Short single-line plain text for embedding as data inside prompts. */
export function cleanPromptText(v: unknown, max = 120): string {
  if (typeof v !== "string") return "";
  return v.replace(/[\r\n\t`{}<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

export function escapeHtml(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
