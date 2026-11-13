import { render, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import Onboarding from "./Onboarding";

const mocks = vi.hoisted(() => ({ completed: true }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "owner", email: "owner@example.test", user_metadata: {} } }) }));
vi.mock("@/hooks/useProfileCache", () => ({ useProfileCache: () => ({ data: { onboarding_completed: mocks.completed } }) }));
vi.mock("@tanstack/react-query", () => ({ useQuery: () => ({ data: [] }), useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("@/lib/checklistTemplates", () => ({ getChecklistTemplate: () => ({ steps: [] }) }));
vi.mock("../components/StepWelcome", () => ({ default: () => null }));
vi.mock("@/components/brand/GuzzlLogo", () => ({ default: () => null }));

let currentPath = "";
function LocationProbe() { currentPath = useLocation().pathname + useLocation().search; return null; }
function setup(path: string) {
  render(<MemoryRouter initialEntries={[path]}><LocationProbe /><Routes><Route path="/onboarding" element={<Onboarding />} /><Route path="/app" element={null} /></Routes></MemoryRouter>);
}
afterEach(cleanup);
describe("setup wizard reruns", () => {
  it("keeps completed accounts in an explicitly requested rerun", async () => {
    mocks.completed = true;
    setup("/onboarding?rerun=true");
    await waitFor(() => expect(currentPath).toBe("/onboarding?rerun=true"));
  });
  it("still redirects completed accounts visiting normal onboarding", async () => {
    mocks.completed = true;
    setup("/onboarding");
    await waitFor(() => expect(currentPath).toBe("/app"));
  });
  it("keeps incomplete accounts in normal onboarding", async () => {
    mocks.completed = false;
    setup("/onboarding");
    await waitFor(() => expect(currentPath).toBe("/onboarding"));
  });
});