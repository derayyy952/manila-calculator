import { type Dispatch, type SetStateAction, useState } from "react";
import { calculateCashEV, type EVResult } from "./lib/ev";
import {
  calculateSingleShipPirateEV,
  type PirateResult,
} from "./lib/pirate";
import {
  calculateArrivalProbability,
  type ProbabilityResult,
} from "./lib/probability";

const currentPositionOptions = Array.from({ length: 13 }, (_, index) => index);
const harborTargetOptions = [10, 11, 12, 13, 14, 15];
const remainingRollOptions = [0, 1, 2, 3];
const moneyOptions = Array.from({ length: 16 }, (_, index) => index * 5);
const costOptions = Array.from({ length: 13 }, (_, index) => index);
const pirateCountOptions = [1, 2];
const manilaDiceSides = 6;

type BoatInput = {
  id: string;
  name: string;
  currentPosition: number;
  harborTarget: number;
};

type SuccessSource = "arrives" | "fails";

type BetInput = {
  id: string;
  name: string;
  boatId: string;
  successSource: SuccessSource;
  cost: number;
  successPayout: number;
  failurePayout: number;
};

type PirateInputState = {
  cost: number;
  pirateCount: 1 | 2;
  lootValues: Record<string, number>;
};

const initialBoats: BoatInput[] = [
  {
    id: "boat-1",
    name: "船 1",
    currentPosition: 7,
    harborTarget: 13,
  },
  {
    id: "boat-2",
    name: "船 2",
    currentPosition: 7,
    harborTarget: 13,
  },
  {
    id: "boat-3",
    name: "船 3",
    currentPosition: 7,
    harborTarget: 13,
  },
];

const initialBets: BetInput[] = [
  {
    id: "bet-1",
    name: "下注 1",
    boatId: "boat-1",
    successSource: "arrives",
    cost: 5,
    successPayout: 20,
    failurePayout: 0,
  },
  {
    id: "bet-2",
    name: "下注 2",
    boatId: "boat-2",
    successSource: "arrives",
    cost: 5,
    successPayout: 20,
    failurePayout: 0,
  },
  {
    id: "bet-3",
    name: "下注 3",
    boatId: "boat-3",
    successSource: "fails",
    cost: 4,
    successPayout: 15,
    failurePayout: 0,
  },
];

const initialPirateInput: PirateInputState = {
  cost: 5,
  pirateCount: 1,
  lootValues: {
    "boat-1": 20,
    "boat-2": 20,
    "boat-3": 20,
  },
};

const numberFormatter = new Intl.NumberFormat("zh-Hant", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const evFormatter = new Intl.NumberFormat("zh-Hant", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  signDisplay: "exceptZero",
});

function App() {
  const [boats, setBoats] = useState<BoatInput[]>(initialBoats);
  const [remainingRolls, setRemainingRolls] = useState(2);
  const [bets, setBets] = useState<BetInput[]>(initialBets);
  const [pirateInput, setPirateInput] =
    useState<PirateInputState>(initialPirateInput);
  const [showPirateAnalysis, setShowPirateAnalysis] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);

  const boatResults = boats.map((boat) => ({
    boat,
    result: calculateArrivalProbability({
      currentPosition: boat.currentPosition,
      harborTarget: boat.harborTarget,
      remainingRolls,
      diceSides: manilaDiceSides,
    }),
  }));

  const boatResultById = new Map(
    boatResults.map(({ boat, result }) => [boat.id, result]),
  );

  const betResults = bets.map((bet) => {
    const boatResult = boatResultById.get(bet.boatId);
    const successProbability = getBetSuccessProbability(bet, boatResult);
    const evResult = calculateCashEV({
      successProbability,
      successPayout: bet.successPayout,
      failurePayout: bet.failurePayout,
      cost: bet.cost,
    });

    return {
      bet,
      evResult,
      successProbability,
    };
  });

  const pirateResult = calculateSingleShipPirateEV({
    arrivalProbabilities: boatResults.map(({ result }) => result.arrivalProbability),
    lootValues: boats.map((boat) => pirateInput.lootValues[boat.id] ?? 0),
    pirateCount: pirateInput.pirateCount,
    cost: pirateInput.cost,
  });

  const totalOutcomes = boatResults[0]?.result.totalOutcomes ?? 0;

  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">Manila v0.3</p>
        <h1>機率與下注 EV 計算器</h1>
        <p className="intro">
          三艘船共用同一個剩餘骰子數。先算船隻到港率，再評估下注位置與只能搶 1 艘的海盜船 EV。
        </p>
      </section>

      <div className="workspace-grid">
        <section className="calculator-card" aria-labelledby="calculator-title">
          <div className="section-heading">
            <h2 id="calculator-title">局面輸入</h2>
            <span>每船 {totalOutcomes} 種結果</span>
          </div>

          <div className="shared-control">
            <SelectField
              label="全局剩餘骰子"
              value={remainingRolls}
              options={remainingRollOptions}
              onChange={setRemainingRolls}
            />
            <p>三艘船同步使用這個骰子數；Manila 骰子固定為 6 面。</p>
          </div>

          <div className="boat-input-list">
            {boats.map((boat, index) => (
              <BoatInputRow
                boat={boat}
                index={index}
                key={boat.id}
                onChange={(field, value) =>
                  updateBoat(index, field, value, setBoats)
                }
              />
            ))}
          </div>

          <div className="subsection-heading">
            <h3>下注位置 EV</h3>
            <span>v0.2 現金 EV</span>
          </div>

          <div className="bet-input-list">
            {bets.map((bet, index) => (
              <BetInputRow
                bet={bet}
                boatOptions={boats}
                key={bet.id}
                onChange={(field, value) =>
                  updateBet(index, field, value, setBets)
                }
              />
            ))}
          </div>

          <button
            className="secondary-button"
            onClick={() => setShowPirateAnalysis((current) => !current)}
          >
            {showPirateAnalysis ? "收起海盜船分析" : "海盜船分析"}
          </button>

          {showPirateAnalysis ? (
            <PirateInputPanel
              boats={boats}
              pirateInput={pirateInput}
              setPirateInput={setPirateInput}
            />
          ) : null}

          <button className="calculate-button" onClick={() => setHasCalculated(true)}>
            計算
          </button>
        </section>

        <section className="result-card" aria-live="polite">
          <div className="section-heading">
            <h2>即時結果</h2>
            <span>{hasCalculated ? "已更新" : "預設範例"}</span>
          </div>

          <div className="boat-result-list">
            {boatResults.map(({ boat, result }) => (
              <BoatResultCard
                boat={boat}
                key={boat.id}
                remainingRolls={remainingRolls}
                result={result}
              />
            ))}
          </div>

          <div className="subsection-heading result-subsection">
            <h3>下注 EV</h3>
            <span>按 EV 高低判斷</span>
          </div>

          <div className="ev-result-list">
            {betResults.map(({ bet, evResult, successProbability }) => (
              <BetResultCard
                bet={bet}
                evResult={evResult}
                key={bet.id}
                successProbability={successProbability}
              />
            ))}
          </div>

          {showPirateAnalysis ? (
            <>
              <div className="subsection-heading result-subsection">
                <h3>海盜船分析</h3>
                <span>只能搶 1 艘</span>
              </div>
              <PirateResultCard result={pirateResult} />
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
}

type BoatInputRowProps = {
  boat: BoatInput;
  index: number;
  onChange: (
    field: "currentPosition" | "harborTarget",
    value: number,
  ) => void;
};

function BoatInputRow({ boat, index, onChange }: BoatInputRowProps) {
  const displayName = boat.name || `船 ${index + 1}`;

  return (
    <div className="boat-input-row">
      <div className="boat-name">
        <span>出航船隻</span>
        <strong>{displayName}</strong>
      </div>
      <SelectField
        label="目前位置"
        value={boat.currentPosition}
        options={currentPositionOptions}
        onChange={(value) => onChange("currentPosition", value)}
      />
      <SelectField
        label="目標位置"
        value={boat.harborTarget}
        options={harborTargetOptions}
        onChange={(value) => onChange("harborTarget", value)}
      />
    </div>
  );
}

type BetInputRowProps = {
  bet: BetInput;
  boatOptions: BoatInput[];
  onChange: <K extends keyof BetInput>(field: K, value: BetInput[K]) => void;
};

function BetInputRow({ bet, boatOptions, onChange }: BetInputRowProps) {
  return (
    <div className="bet-input-row">
      <div className="bet-name">
        <span>位置</span>
        <strong>{bet.name}</strong>
      </div>
      <StringSelectField
        label="套用船"
        value={bet.boatId}
        options={boatOptions.map((boat) => ({
          label: boat.name,
          value: boat.id,
        }))}
        onChange={(value) => onChange("boatId", value)}
      />
      <StringSelectField
        label="成功條件"
        value={bet.successSource}
        options={[
          { label: "船到港", value: "arrives" },
          { label: "船未到港", value: "fails" },
        ]}
        onChange={(value) => onChange("successSource", value as SuccessSource)}
      />
      <SelectField
        label="成本"
        value={bet.cost}
        options={costOptions}
        onChange={(value) => onChange("cost", value)}
      />
      <SelectField
        label="成功收益"
        value={bet.successPayout}
        options={moneyOptions}
        onChange={(value) => onChange("successPayout", value)}
      />
      <SelectField
        label="失敗收益"
        value={bet.failurePayout}
        options={moneyOptions}
        onChange={(value) => onChange("failurePayout", value)}
      />
    </div>
  );
}

type PirateInputPanelProps = {
  boats: BoatInput[];
  pirateInput: PirateInputState;
  setPirateInput: Dispatch<SetStateAction<PirateInputState>>;
};

function PirateInputPanel({
  boats,
  pirateInput,
  setPirateInput,
}: PirateInputPanelProps) {
  return (
    <div className="pirate-panel">
      <div className="pirate-config-row">
        <SelectField
          label="海盜成本"
          value={pirateInput.cost}
          options={costOptions}
          onChange={(value) =>
            setPirateInput((current) => ({ ...current, cost: value }))
          }
        />
        <SelectField
          label="海盜玩家人數"
          value={pirateInput.pirateCount}
          options={pirateCountOptions}
          onChange={(value) =>
            setPirateInput((current) => ({
              ...current,
              pirateCount: value === 2 ? 2 : 1,
            }))
          }
        />
      </div>

      <div className="pirate-loot-list">
        {boats.map((boat) => (
          <SelectField
            key={boat.id}
            label={`${boat.name} 可搶收益`}
            value={pirateInput.lootValues[boat.id] ?? 0}
            options={moneyOptions}
            onChange={(value) =>
              setPirateInput((current) => ({
                ...current,
                lootValues: {
                  ...current.lootValues,
                  [boat.id]: value,
                },
              }))
            }
          />
        ))}
      </div>

      <p className="model-note">
        模型假設海盜只能搶 1 艘；如果多艘船到港，會取可搶收益最高的那艘計算期望值。
      </p>
    </div>
  );
}

function updateBoat(
  index: number,
  field: "currentPosition" | "harborTarget",
  value: number,
  setBoats: Dispatch<SetStateAction<BoatInput[]>>,
) {
  setBoats((currentBoats) =>
    currentBoats.map((boat, boatIndex) =>
      boatIndex === index ? { ...boat, [field]: value } : boat,
    ),
  );
}

function updateBet<K extends keyof BetInput>(
  index: number,
  field: K,
  value: BetInput[K],
  setBets: Dispatch<SetStateAction<BetInput[]>>,
) {
  setBets((currentBets) =>
    currentBets.map((bet, betIndex) =>
      betIndex === index ? { ...bet, [field]: value } : bet,
    ),
  );
}

type BoatResultCardProps = {
  boat: BoatInput;
  remainingRolls: number;
  result: ProbabilityResult;
};

function BoatResultCard({ boat, remainingRolls, result }: BoatResultCardProps) {
  const arrivalPercent = formatPercent(result.arrivalProbability);
  const failurePercent = formatPercent(result.failureProbability);

  return (
    <article className="boat-result-card">
      <div className="boat-result-heading">
        <div>
          <span>{boat.name}</span>
          <h3>
            位置 {boat.currentPosition} → {boat.harborTarget}
          </h3>
        </div>
        <strong>剩 {remainingRolls} 骰</strong>
      </div>

      <div className="probability-grid">
        <ResultTile label="到港機率" value={arrivalPercent} tone="arrival" />
        <ResultTile label="未到港機率" value={failurePercent} tone="failure" />
      </div>

      <div className="distribution-panel">
        <h4>最終位置分佈</h4>
        <div className="distribution-list">
          {Object.entries(result.finalPositionDistribution).map(
            ([position, probability]) => (
              <div className="distribution-row" key={position}>
                <span className="position-label">{formatPosition(position)}</span>
                <div className="bar-track" aria-hidden="true">
                  <div
                    className="bar-fill"
                    style={{ width: `${probability * 100}%` }}
                  />
                </div>
                <span className="percent-label">{formatPercent(probability)}</span>
              </div>
            ),
          )}
        </div>
      </div>
    </article>
  );
}

type BetResultCardProps = {
  bet: BetInput;
  evResult: EVResult;
  successProbability: number;
};

function BetResultCard({ bet, evResult, successProbability }: BetResultCardProps) {
  return (
    <article className="ev-result-card">
      <div className="ev-result-heading">
        <div>
          <span>{bet.name}</span>
          <h3>{formatEV(evResult.ev)}</h3>
        </div>
        <strong>{rateEV(evResult.ev)}</strong>
      </div>
      <dl className="ev-metrics">
        <div>
          <dt>成功率</dt>
          <dd>{formatPercent(successProbability)}</dd>
        </div>
        <div>
          <dt>ROI</dt>
          <dd>{formatNullablePercent(evResult.roi)}</dd>
        </div>
        <div>
          <dt>盈虧平衡</dt>
          <dd>{formatNullablePercent(evResult.breakEvenProbability)}</dd>
        </div>
      </dl>
    </article>
  );
}

type PirateResultCardProps = {
  result: PirateResult;
};

function PirateResultCard({ result }: PirateResultCardProps) {
  return (
    <article className="pirate-result-card">
      <div className="pirate-result-hero">
        <div>
          <span>海盜 EV</span>
          <h3>{formatEV(result.ev)}</h3>
        </div>
        <strong>{result.recommendation}</strong>
      </div>
      <dl className="ev-metrics pirate-metrics">
        <div>
          <dt>有船可搶</dt>
          <dd>{formatPercent(result.stealableProbability)}</dd>
        </div>
        <div>
          <dt>期望可搶收益</dt>
          <dd>{numberFormatter.format(result.expectedLoot)}</dd>
        </div>
        <div>
          <dt>單人期望收益</dt>
          <dd>{numberFormatter.format(result.expectedLootPerPirate)}</dd>
        </div>
      </dl>
    </article>
  );
}

type SelectFieldProps = {
  label: string;
  value: number;
  options: number[];
  onChange: (value: number) => void;
};

function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <label className="select-field">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

type StringSelectFieldProps = {
  label: string;
  value: string;
  options: Array<{
    label: string;
    value: string;
  }>;
  onChange: (value: string) => void;
};

function StringSelectField({
  label,
  value,
  options,
  onChange,
}: StringSelectFieldProps) {
  return (
    <label className="select-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

type ResultTileProps = {
  label: string;
  value: string;
  tone: "arrival" | "failure";
};

function ResultTile({ label, value, tone }: ResultTileProps) {
  return (
    <div className={`result-tile ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getBetSuccessProbability(
  bet: BetInput,
  boatResult: ProbabilityResult | undefined,
): number {
  if (!boatResult) {
    return 0;
  }

  return bet.successSource === "arrives"
    ? boatResult.arrivalProbability
    : boatResult.failureProbability;
}

function formatPercent(probability: number): string {
  return `${numberFormatter.format(probability * 100)}%`;
}

function formatNullablePercent(value: number | null): string {
  return value === null ? "N/A" : formatPercent(value);
}

function formatEV(ev: number): string {
  return evFormatter.format(ev);
}

function formatPosition(position: string): string {
  return position.endsWith("_or_more")
    ? `${position.replace("_or_more", "")}+ 到港`
    : `位置 ${position}`;
}

function rateEV(ev: number): string {
  if (ev >= 5) {
    return "強";
  }

  if (ev >= 0) {
    return "可考慮";
  }

  return "不划算";
}

export default App;
