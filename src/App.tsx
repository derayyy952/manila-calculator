import { type Dispatch, type SetStateAction, useState } from "react";
import { calculateCashEV } from "./lib/ev";
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
const costOptions = Array.from({ length: 13 }, (_, index) => index);
const pirateCountOptions = [1, 2];
const manilaDiceSides = 6;

type CargoProfile = {
  id: string;
  label: string;
  value: number;
  seatCosts: number[];
};

const cargoProfiles: CargoProfile[] = [
  {
    id: "yellow",
    label: "黃色 18",
    value: 18,
    seatCosts: [1, 2, 3],
  },
  {
    id: "brown",
    label: "棕色 24",
    value: 24,
    seatCosts: [2, 3, 4],
  },
  {
    id: "blue",
    label: "藍色 30",
    value: 30,
    seatCosts: [3, 4, 5],
  },
  {
    id: "green",
    label: "綠色 36",
    value: 36,
    seatCosts: [3, 4, 5, 5],
  },
];

const moneyOptions = [
  ...new Set([
    ...Array.from({ length: 16 }, (_, index) => index * 5),
    ...cargoProfiles.map((cargo) => cargo.value),
  ]),
].sort((left, right) => left - right);

type BoatInput = {
  id: string;
  name: string;
  cargoId: string;
  currentPosition: number;
  harborTarget: number;
  seatIndex: number;
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
    cargoId: "yellow",
    currentPosition: 7,
    harborTarget: 13,
    seatIndex: 0,
  },
  {
    id: "boat-2",
    name: "船 2",
    cargoId: "brown",
    currentPosition: 7,
    harborTarget: 13,
    seatIndex: 0,
  },
  {
    id: "boat-3",
    name: "船 3",
    cargoId: "blue",
    currentPosition: 7,
    harborTarget: 13,
    seatIndex: 0,
  },
];

const initialPirateInput: PirateInputState = {
  cost: 5,
  pirateCount: 1,
  lootValues: {
    "boat-1": 18,
    "boat-2": 24,
    "boat-3": 30,
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
  const [pirateInput, setPirateInput] =
    useState<PirateInputState>(initialPirateInput);
  const [showPirateAnalysis, setShowPirateAnalysis] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);

  const boatResults = boats.map((boat) => ({
    boat,
    cargo: getCargoProfile(boat.cargoId),
    result: calculateArrivalProbability({
      currentPosition: boat.currentPosition,
      harborTarget: boat.harborTarget,
      remainingRolls,
      diceSides: manilaDiceSides,
    }),
  }));

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
        <h1>機率與坐船 EV 計算器</h1>
        <p className="intro">
          三艘船共用同一個剩餘骰子數。先算船隻到港率，再評估坐船位置與只能搶 1 艘的海盜船 EV。
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
                  updateBoat(index, field, value, setBoats, setPirateInput)
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
            {boatResults.map(({ boat, cargo, result }) => (
              <BoatResultCard
                boat={boat}
                cargo={cargo}
                key={boat.id}
                remainingRolls={remainingRolls}
                result={result}
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
    field:
      | "cargoId"
      | "currentPosition"
      | "harborTarget"
      | "seatIndex",
    value: number | string,
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
      <StringSelectField
        label="貨物收益"
        value={boat.cargoId}
        options={cargoProfiles.map((cargo) => ({
          label: cargo.label,
          value: cargo.id,
        }))}
        onChange={(value) => onChange("cargoId", value)}
      />
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
      <SelectField
        label="坐船位置"
        value={boat.seatIndex}
        options={getSeatIndexOptions(getCargoProfile(boat.cargoId))}
        formatOption={(value) =>
          formatSeatPositionOption(value, getCargoProfile(boat.cargoId))
        }
        onChange={(value) => onChange("seatIndex", value)}
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
  field:
    | "cargoId"
    | "currentPosition"
    | "harborTarget"
    | "seatIndex",
  value: number | string,
  setBoats: Dispatch<SetStateAction<BoatInput[]>>,
  setPirateInput: Dispatch<SetStateAction<PirateInputState>>,
) {
  setBoats((currentBoats) =>
    currentBoats.map((boat, boatIndex) => {
      if (boatIndex !== index) {
        return boat;
      }

      if (field === "cargoId") {
        const cargo = getCargoProfile(String(value));
        setPirateInput((current) => ({
          ...current,
          lootValues: {
            ...current.lootValues,
            [boat.id]: cargo.value,
          },
        }));

        return {
          ...boat,
          cargoId: cargo.id,
          seatIndex: 0,
        };
      }

      if (field === "currentPosition") {
        return { ...boat, currentPosition: Number(value) };
      }

      if (field === "harborTarget") {
        return { ...boat, harborTarget: Number(value) };
      }

      return { ...boat, seatIndex: Number(value) };
    }),
  );
}

type BoatResultCardProps = {
  boat: BoatInput;
  cargo: CargoProfile;
  remainingRolls: number;
  result: ProbabilityResult;
};

function BoatResultCard({
  boat,
  cargo,
  remainingRolls,
  result,
}: BoatResultCardProps) {
  const arrivalPercent = formatPercent(result.arrivalProbability);
  const failurePercent = formatPercent(result.failureProbability);
  const seatCost = cargo.seatCosts[boat.seatIndex] ?? cargo.seatCosts[0] ?? 0;
  const inferredPassengerCount = boat.seatIndex + 1;
  const personalPayout = cargo.value / inferredPassengerCount;
  const seatEV = calculateCashEV({
    successProbability: result.arrivalProbability,
    successPayout: personalPayout,
    failurePayout: 0,
    cost: seatCost,
  });

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

      <dl className="boat-cargo-metrics">
        <div>
          <dt>貨物收益</dt>
          <dd>{cargo.value}</dd>
        </div>
        <div>
          <dt>單人分得</dt>
          <dd>{numberFormatter.format(personalPayout)}</dd>
        </div>
        <div>
          <dt>推定人數</dt>
          <dd>{inferredPassengerCount}</dd>
        </div>
        <div>
          <dt>位置成本</dt>
          <dd>{seatCost}</dd>
        </div>
        <div>
          <dt>坐船 EV</dt>
          <dd>{formatEV(seatEV.ev)}</dd>
        </div>
      </dl>

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
  formatOption?: (value: number) => string;
  onChange: (value: number) => void;
};

function SelectField({
  label,
  value,
  options,
  formatOption,
  onChange,
}: SelectFieldProps) {
  return (
    <label className="select-field">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {options.map((option, index) => (
          <option key={`${option}-${index}`} value={option}>
            {formatOption ? formatOption(option) : option}
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

function getCargoProfile(cargoId: string): CargoProfile {
  return cargoProfiles.find((cargo) => cargo.id === cargoId) ?? cargoProfiles[0]!;
}

function getSeatIndexOptions(cargo: CargoProfile): number[] {
  return cargo.seatCosts.map((_, index) => index);
}

function formatSeatPositionOption(seatIndex: number, cargo: CargoProfile): string {
  const cost = cargo.seatCosts[seatIndex] ?? 0;

  return `位置 ${seatIndex + 1}（成本 ${cost}，/${seatIndex + 1}）`;
}

function formatPercent(probability: number): string {
  return `${numberFormatter.format(probability * 100)}%`;
}

function formatEV(ev: number): string {
  return evFormatter.format(ev);
}

function formatPosition(position: string): string {
  return position.endsWith("_or_more")
    ? `${position.replace("_or_more", "")}+ 到港`
    : `位置 ${position}`;
}

export default App;
