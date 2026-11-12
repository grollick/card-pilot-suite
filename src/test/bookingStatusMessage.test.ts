import { describe, it, expect } from "vitest";
import { bookingStatusMessage } from "@/hooks/useBookings";

const base = { success: true, status: "confirmed", emailAttempted: true, hasEmail: true, emailQueued: true, customerEmail: "a@b.com" };
describe("bookingStatusMessage", () => {
  it("names the address when the email was queued", () => {
    expect(bookingStatusMessage("Booking confirmed", base)).toBe("Booking confirmed. Email sent to a@b.com.");
  });
  it("says no email on file", () => {
    expect(bookingStatusMessage("Booking confirmed", { ...base, hasEmail: false, emailQueued: false, customerEmail: null })).toBe("Booking confirmed. No email on file for this customer.");
  });
  it("admits failure", () => {
    expect(bookingStatusMessage("Booking confirmed", { ...base, emailQueued: false })).toBe("Booking confirmed, but the email could not be sent.");
  });
});
