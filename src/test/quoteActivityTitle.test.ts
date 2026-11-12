import { it, expect } from "vitest";
import { quoteActivityTitle } from "@/modules/card/components/QuoteCalculator";
it("same low and high shows one price", () => expect(quoteActivityTitle("Deck", 1800, 1800)).toBe("Instant quote: Deck, $1,800"));
it("range shows both", () => expect(quoteActivityTitle("Deck", 1800, 2400)).toBe("Instant quote: Deck, $1,800 to $2,400"));
