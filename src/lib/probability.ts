export type ProbabilityResult = {
  arrivalProbability: number;
  failureProbability: number;
  finalPositionDistribution: Record<string, number>;
  totalOutcomes: number;
};

export type ArrivalProbabilityInput = {
  currentPosition: number;
  harborTarget: number;
  remainingRolls: number;
  diceSides: number;
};

export function enumerateRollSums(
  remainingRolls: number,
  diceSides: number,
): number[] {
  if (!Number.isInteger(remainingRolls) || remainingRolls < 0) {
    throw new Error("remainingRolls must be a non-negative integer");
  }

  if (!Number.isInteger(diceSides) || diceSides < 1) {
    throw new Error("diceSides must be a positive integer");
  }

  let sums = [0];

  for (let roll = 0; roll < remainingRolls; roll += 1) {
    const nextSums: number[] = [];

    for (const previousSum of sums) {
      for (let face = 1; face <= diceSides; face += 1) {
        nextSums.push(previousSum + face);
      }
    }

    sums = nextSums;
  }

  return sums;
}

export function calculateArrivalProbability({
  currentPosition,
  harborTarget,
  remainingRolls,
  diceSides,
}: ArrivalProbabilityInput): ProbabilityResult {
  if (!Number.isFinite(currentPosition) || !Number.isFinite(harborTarget)) {
    throw new Error("currentPosition and harborTarget must be finite numbers");
  }

  const rollSums = enumerateRollSums(remainingRolls, diceSides);
  const totalOutcomes = rollSums.length;
  const distributionCounts = new Map<string, number>();
  let arrivalCount = 0;

  for (const sum of rollSums) {
    const finalPosition = currentPosition + sum;
    const arrived = finalPosition >= harborTarget;
    const key = arrived ? `${harborTarget}_or_more` : String(finalPosition);

    if (arrived) {
      arrivalCount += 1;
    }

    distributionCounts.set(key, (distributionCounts.get(key) ?? 0) + 1);
  }

  const finalPositionDistribution = Object.fromEntries(
    [...distributionCounts.entries()]
      .sort(([left], [right]) => comparePositionKeys(left, right, harborTarget))
      .map(([position, count]) => [position, count / totalOutcomes]),
  );

  const arrivalProbability = arrivalCount / totalOutcomes;

  return {
    arrivalProbability,
    failureProbability: 1 - arrivalProbability,
    finalPositionDistribution,
    totalOutcomes,
  };
}

function comparePositionKeys(
  left: string,
  right: string,
  harborTarget: number,
): number {
  return positionKeyValue(left, harborTarget) - positionKeyValue(right, harborTarget);
}

function positionKeyValue(key: string, harborTarget: number): number {
  return key.endsWith("_or_more") ? harborTarget : Number(key);
}
