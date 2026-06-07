import { describe, expect, it } from "vitest";
import {
  calculateArrivalProbability,
  enumerateRollSums,
} from "./probability";

describe("enumerateRollSums", () => {
  it("enumerates all possible sums for two six-sided dice", () => {
    const sums = enumerateRollSums(2, 6);

    expect(sums).toHaveLength(36);
    expect(sums.filter((sum) => sum === 2)).toHaveLength(1);
    expect(sums.filter((sum) => sum === 7)).toHaveLength(6);
    expect(sums.filter((sum) => sum === 12)).toHaveLength(1);
  });
});

describe("calculateArrivalProbability", () => {
  it("calculates a one-roll arrival probability", () => {
    const result = calculateArrivalProbability({
      currentPosition: 10,
      harborTarget: 13,
      remainingRolls: 1,
      diceSides: 6,
    });

    expect(result.arrivalProbability).toBeCloseTo(4 / 6);
    expect(result.failureProbability).toBeCloseTo(2 / 6);
    expect(result.finalPositionDistribution["13_or_more"]).toBeCloseTo(4 / 6);
  });

  it("calculates a two-roll arrival probability", () => {
    const result = calculateArrivalProbability({
      currentPosition: 7,
      harborTarget: 13,
      remainingRolls: 2,
      diceSides: 6,
    });

    expect(result.arrivalProbability).toBeCloseTo(26 / 36);
    expect(result.failureProbability).toBeCloseTo(10 / 36);
  });

  it("returns a final position distribution that sums to one", () => {
    const result = calculateArrivalProbability({
      currentPosition: 5,
      harborTarget: 13,
      remainingRolls: 2,
      diceSides: 6,
    });

    const distributionTotal = Object.values(result.finalPositionDistribution).reduce(
      (sum, probability) => sum + probability,
      0,
    );

    expect(distributionTotal).toBeCloseTo(1);
    expect(result.arrivalProbability).toBeCloseTo(15 / 36);
  });
});
