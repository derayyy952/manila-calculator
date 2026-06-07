export type PirateRecommendation = "EV 支持搶" | "可考慮" | "不建議";

export type PirateInput = {
  arrivalProbabilities: number[];
  lootValues: number[];
  pirateCount: 1 | 2;
  cost: number;
};

export type PirateResult = {
  stealableProbability: number;
  expectedLoot: number;
  expectedLootPerPirate: number;
  ev: number;
  recommendation: PirateRecommendation;
};

export function calculateSingleShipPirateEV(input: PirateInput): PirateResult {
  if (input.arrivalProbabilities.length !== input.lootValues.length) {
    throw new Error("arrivalProbabilities and lootValues must have the same length");
  }

  if (input.arrivalProbabilities.length === 0) {
    throw new Error("at least one ship is required");
  }

  if (input.pirateCount !== 1 && input.pirateCount !== 2) {
    throw new Error("pirateCount must be 1 or 2");
  }

  input.arrivalProbabilities.forEach(validateProbability);

  const scenarioCount = 2 ** input.arrivalProbabilities.length;
  let stealableProbability = 0;
  let expectedLoot = 0;

  for (let mask = 0; mask < scenarioCount; mask += 1) {
    let scenarioProbability = 1;
    const arrivedLootValues: number[] = [];

    input.arrivalProbabilities.forEach((arrivalProbability, index) => {
      const arrived = (mask & (1 << index)) !== 0;
      scenarioProbability *= arrived ? arrivalProbability : 1 - arrivalProbability;

      if (arrived) {
        arrivedLootValues.push(input.lootValues[index] ?? 0);
      }
    });

    if (arrivedLootValues.length > 0) {
      stealableProbability += scenarioProbability;
      expectedLoot += scenarioProbability * Math.max(...arrivedLootValues);
    }
  }

  const expectedLootPerPirate = expectedLoot / input.pirateCount;
  const ev = expectedLootPerPirate - input.cost;

  return {
    stealableProbability,
    expectedLoot,
    expectedLootPerPirate,
    ev,
    recommendation: recommendPirate(ev),
  };
}

function validateProbability(probability: number) {
  if (!Number.isFinite(probability) || probability < 0 || probability > 1) {
    throw new Error("arrival probabilities must be between 0 and 1");
  }
}

function recommendPirate(ev: number): PirateRecommendation {
  if (ev >= 5) {
    return "EV 支持搶";
  }

  if (ev >= 0) {
    return "可考慮";
  }

  return "不建議";
}
