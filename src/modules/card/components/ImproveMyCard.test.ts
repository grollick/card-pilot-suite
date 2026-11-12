import { describe, expect, it } from "vitest";
import { analyzeCard } from "./ImproveMyCard";
import type { CardSection } from "@/hooks/useCard";

const section = (id: string, content: Record<string, unknown>): CardSection => ({ id, label: id, enabled: true, content });
describe("card improvements reflect current content", () => {
  it("flags enabled but empty testimonials and gallery", () => {
    const issues = analyzeCard([section("testimonials", { testimonials: [] }), section("gallery", { images: [] })], {}, "photo", "cover");
    expect(issues.map(i => i.id)).toEqual(expect.arrayContaining(["testimonials-disabled", "gallery-empty"]));
  });
  it("does not count blank entries as completed", () => {
    const issues = analyzeCard([section("testimonials", { testimonials: [{ name: "", text: "" }] }), section("gallery", { images: [{ url: " " }] })], {}, "photo", "cover");
    expect(issues.map(i => i.id)).toEqual(expect.arrayContaining(["testimonials-disabled", "gallery-empty"]));
  });
  it("clears issues only when real content is present", () => {
    const issues = analyzeCard([section("testimonials", { testimonials: [{ name: "Example customer", text: "Example review" }] }), section("gallery", { images: [{ url: "/example.jpg" }] })], {}, "photo", "cover");
    expect(issues.map(i => i.id)).not.toContain("testimonials-disabled");
    expect(issues.map(i => i.id)).not.toContain("gallery-empty");
  });
  it("uses the current avatar rather than an old saved profile photo", () => {
    expect(analyzeCard([], { avatar_url: "old-photo" }, null, "cover").map(i => i.id)).toContain("no-avatar");
  });
});