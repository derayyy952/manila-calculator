import { describe, expect, it } from "vitest";
import { calculateSingleShipPirateEV } from "./pirate";

describe("calculateSingleShipPirateEV", () => {
  it("uses the highest loot value when multiple ships arrive", () => {
    const result = calculateSingleShipPirateEV({
      arrivalProbabilities: [0.7, 0.4, 0.6],
      lootValues: [10, 30, 20],
      pirateCount: 1,
      cost: 5,
    });

    expect(result.stealableProbability).toBeCloseTo(0.928);
    expect(result.expectedLoot).toBeCloseTo(20.88);
    expect(result.expectedLootPerPirate).toBeCloseTo(20.88);
    expect(result.ev).toBeCloseTo(15.88);
    expect(result.recommendation).toBe("EV 支持搶");
  });

  it("splits expected loot between two pirate players", () => {
    const result = calculateSingleShipPirateEV({
      arrivalProbabilities: [0.7, 0.4, 0.6],
      lootValues: [10, 30, 20],
      pirateCount: 2,
      cost: 5,
    });

    expect(result.expectedLootPerPirate).toBeCloseTo(10.44);
    expect(result.ev).toBeCloseTo(5.44);
  });

  it("can recommend against a low-value pirate position", () => {
    const result = calculateSingleShipPirateEV({
      arrivalProbabilities: [0.2, 0.2, 0.2],
      lootValues: [5, 5, 5],
      pirateCount: 2,
      cost: 5,
    });

    expect(result.ev).toBeLessThan(0);
    expect(result.recommendation).toBe("不建議");
  });
});
