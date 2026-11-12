import { describe, it, expect } from "vitest";
import { buildCustomerPayload, statusAfterView, statusAfterSend, respondError } from "../../supabase/functions/estimate-share/logic";

const est = {
  id: "e1", user_id: "u1", lead_id: "l1", estimate_number: "EST-1", status: "sent",
  issue_date: "2026-11-01", expiry_date: null, subtotal: 1000, tax_total: 130, grand_total: 1130,
  internal_notes: "secret margin", labor_total: 600, material_total: 300, markup_total: 100,
  deposit_amount: 0, deposit_percent: 0,
};
const items = [{ section_id: "s1", title: "Paint", quantity: 2, unit: "room", line_total: 1000, is_optional: false,
  labor_hours: 10, labor_rate: 60, material_cost: 300, markup_percent: 20, unit_price: 500 }];

describe("customer payload", () => {
  it("never contains internal notes, labor, material or markup fields", () => {
    const out = JSON.stringify(buildCustomerPayload(est, [{ id: "s1", name: "Walls" }], items, { company: "Bob Painting", email: "bob@x.com" } as any, "Sarah Lee"));
    for (const k of ["internal_notes", "labor", "material", "markup", "user_id", "lead_id", "email", "secret margin", "unit_price"]) {
      expect(out).not.toContain(k);
    }
    expect(out).toContain("Sarah");
    expect(out).not.toContain("Lee");
  });
});

describe("status rules", () => {
  it("sent becomes viewed once", () => {
    expect(statusAfterView("sent")).toBe("viewed");
    expect(statusAfterView("viewed")).toBe("viewed");
    expect(statusAfterView("approved")).toBe("approved");
  });
  it("sending never moves an estimate backwards", () => {
    expect(statusAfterSend("draft")).toBe("sent");
    expect(statusAfterSend("viewed")).toBe("viewed");
    expect(statusAfterSend("approved")).toBe("approved");
  });
  it("a second response is refused", () => {
    expect(respondError({ status: "approved" }, "declined", "Sarah")).not.toBeNull();
    expect(respondError({ status: "declined" }, "approved", "Sarah")).not.toBeNull();
    expect(respondError({ status: "viewed" }, "approved", "Sarah")).toBeNull();
  });
  it("an expired estimate cannot be approved", () => {
    const now = new Date("2026-11-12T12:00:00");
    expect(respondError({ status: "viewed", expiry_date: "2026-11-10" }, "approved", "Sarah", now)).toBe("This estimate has expired.");
    expect(respondError({ status: "viewed", expiry_date: "2026-11-12" }, "approved", "Sarah", now)).toBeNull();
  });
  it("approving needs a name", () => {
    expect(respondError({ status: "viewed" }, "approved", " ")).not.toBeNull();
  });
});

import { lineAmountBeforeTax } from "../../supabase/functions/estimate-share/logic";
describe("line amounts", () => {
  it("$1,130 line at 13% tax shows $1,000 before tax", () => {
    expect(lineAmountBeforeTax(1130, 13)).toBe(1000);
    expect(lineAmountBeforeTax(500, 0)).toBe(500);
  });
});
