import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAiCredits } from "./useAiCredits";

const mocks = vi.hoisted(() => ({
  auth: { user: null as { id: string } | null, session: null as { access_token: string } | null, loading: true },
  getSession: vi.fn(),
  from: vi.fn(),
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => mocks.auth }));
vi.mock("@/hooks/usePlanLimits", () => ({ usePlanLimits: () => ({ limits: { ai_requests_monthly: 8 }, planKey: "free" }) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getSession: mocks.getSession }, from: mocks.from } }));

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return renderHook(() => useAiCredits(), { wrapper });
}

describe("AI credit session readiness", () => {
  beforeEach(() => {
    mocks.auth = { user: null, session: null, loading: true };
    mocks.getSession.mockResolvedValue({ data: { session: null } });
    const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), gt: vi.fn().mockResolvedValue({ data: [] }), maybeSingle: vi.fn().mockResolvedValue({ data: null }) };
    mocks.from.mockReturnValue(chain);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ packs: [{ id: "pack_25", credits: 25 }] }) }));
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

  it("does not request packs before sign-in finishes", async () => {
    setup();
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("does not request packs for a signed-out visitor", async () => {
    mocks.auth.loading = false;
    setup();
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("requests packs with the current token once sign-in finishes", async () => {
    const hook = setup();
    mocks.auth = { user: { id: "owner" }, session: { access_token: "test-session" }, loading: false };
    mocks.getSession.mockResolvedValue({ data: { session: mocks.auth.session } });
    hook.rerender();
    await waitFor(() => expect(hook.result.current.packs).toHaveLength(1));
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("purchase-ai-credits"), expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer test-session" }) }));
  });

  it("does not send a purchase when the session is missing", async () => {
    const hook = setup();
    const result = await hook.result.current.purchasePack("pack_25");
    expect(result.error).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
  });
});