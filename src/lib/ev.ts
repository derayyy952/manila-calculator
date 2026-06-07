export type EVInput = {
  successProbability: number;
  successPayout: number;
  failurePayout: number;
  cost: number;
};

export type EVResult = {
  ev: number;
  roi: number | null;
  breakEvenProbability: number | null;
};

export function calculateCashEV(input: EVInput): EVResult {
  validateProbability(input.successProbability);

  const failProbability = 1 - input.successProbability;
  const ev =
    input.successProbability * input.successPayout +
    failProbability * input.failurePayout -
    input.cost;

  const roi = input.cost === 0 ? null : ev / input.cost;
  const payoutSpread = input.successPayout - input.failurePayout;
  const breakEvenProbability =
    payoutSpread <= 0 ? null : input.cost / payoutSpread;

  return {
    ev,
    roi,
    breakEvenProbability,
  };
}

function validateProbability(probability: number) {
  if (!Number.isFinite(probability) || probability < 0 || probability > 1) {
    throw new Error("successProbability must be between 0 and 1");
  }
}
