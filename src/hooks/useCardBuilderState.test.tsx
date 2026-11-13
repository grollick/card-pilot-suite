import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCardBuilderState } from "./useCardBuilderState";

const mocks = vi.hoisted(() => ({ card: { id: "first", theme_json: {} as Record<string, unknown>, sections_json: [], status: "draft" }, active: "first", save: vi.fn().mockResolvedValue({}), invalidate: vi.fn() }));
vi.mock("react-router-dom", () => ({ useSearchParams: () => [new URLSearchParams({ card: mocks.active })] }));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ invalidateQueries: mocks.invalidate }) }));
vi.mock("@/hooks/useCard", () => ({ useCard: () => ({ data: mocks.card }), useUpsertCard: () => ({ mutateAsync: mocks.save }), useProfile: () => ({ data: { name: "Owner" } }), useStylePack: () => ({}), DEFAULT_SECTIONS: [{ id: "hero", enabled: true }] }));
vi.mock("@/hooks/useCards", () => ({ useProfessionOptions: () => ({ data: [] }) }));
vi.mock("@/hooks/useGenerateContent", () => ({ useGenerateCardContent: () => ({ generate: vi.fn() }) }));
vi.mock("@/modules/card/components/CtaEditor", () => ({ DEFAULT_CTA_CONFIG: [] }));
vi.mock("@/lib/cardTokens", () => ({ resolveCardTheme: () => ({}) }));

afterEach(() => { vi.clearAllMocks(); vi.useRealTimers(); });
describe("card switching isolation", () => {
  it("clears absent design values and never copies the old cover or pending fields into the new card", async () => {
    mocks.active = "first";
    mocks.card = { id: "first", theme_json: { logo_url: "first-logo", cover_url: "first-cover", job_title: "Plumber", name_italic: true, name_font_weight: 900 }, sections_json: [], status: "draft" };
    const hook = renderHook(() => useCardBuilderState());
    await act(async () => { await hook.result.current.saveThemeField({ social_btn_color: "old-color" }); });
    act(() => { hook.result.current.handleThemePreview({ gradientBg: "old-gradient" } as any); hook.result.current.setEditJobTitle("old draft"); });
    mocks.active = "second";
    mocks.card = { id: "second", theme_json: {}, sections_json: [], status: "draft" };
    hook.rerender();
    expect(hook.result.current.logoUrl).toBeNull();
    expect(hook.result.current.coverUrl).toBeNull();
    expect(hook.result.current.jobTitle).toBeNull();
    expect(hook.result.current.nameItalic).toBe(false);
    expect(hook.result.current.nameFontWeight).toBe(700);
    expect(hook.result.current.editJobTitle).toBeNull();
    expect(hook.result.current.currentThemeOverrides.gradientBg).toBeUndefined();
    await act(async () => { await hook.result.current.saveThemeField({ cover_height: 180 }); });
    expect(mocks.save).toHaveBeenLastCalledWith({ theme_json: { cover_url: null, cover_height: 180 } });
    hook.unmount();
  });

  it("cancels delayed section and identity saves on card selection changes", async () => {
    vi.useFakeTimers();
    mocks.active = "first";
    mocks.card = { id: "first", theme_json: {}, sections_json: [], status: "draft" };
    const hook = renderHook(() => useCardBuilderState());
    const identitySave = vi.fn();
    act(() => {
      hook.result.current.saveSections([{ id: "old-section", label: "Old", enabled: true }]);
      hook.result.current.identitySaveTimers.current.title = globalThis.setTimeout(identitySave, 800) as unknown as ReturnType<typeof setTimeout>;
    });
    mocks.active = "second";
    mocks.card = { id: "second", theme_json: {}, sections_json: [], status: "draft" };
    hook.rerender();
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(mocks.save).not.toHaveBeenCalled();
    expect(identitySave).not.toHaveBeenCalled();
    hook.unmount();
  });
});