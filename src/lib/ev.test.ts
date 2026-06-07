import { describe, expect, it } from "vitest";
import { calculateCashEV } from "./ev";

describe("calculateCashEV", () => {
  it("calculates cash EV and ROI", () => {
    const result = calculateCashEV({
      successProbability: 0.4,
      successPayout: 30,
      failurePayout: 0,
      cost: 5,
    });

    expect(result.ev).toBeCloseTo(7);
    expect(result.roi).toBeCloseTo(1.4);
    expect(result.breakEvenProbability).toBeCloseTo(5 / 30);
  });

  it("includes failure payout in EV", () => {
    const result = calculateCashEV({
      successProbability: 0.25,
      successPayout: 20,
      failurePayout: 4,
      cost: 6,
    });

    expect(result.ev).toBeCloseTo(2);
  });

  it("returns null ROI when cost is zero", () => {
    const result = calculateCashEV({
      successProbability: 0.5,
      successPayout: 10,
      failurePayout: 0,
      cost: 0,
    });

    expect(result.roi).toBeNull();
  });
});
