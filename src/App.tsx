import { type Dispatch, type SetStateAction, useState } from "react";
import {
  calculateArrivalProbability,
  type ProbabilityResult,
} from "./lib/probability";

const currentPositionOptions = Array.from({ length: 13 }, (_, index) => index);
const harborTargetOptions = [10, 11, 12, 13, 14, 15];
const remainingRollOptions = [0, 1, 2, 3];
const manilaDiceSides = 6;

type BoatInput = {
  id: string;
  ware: string;
  currentPosition: number;
  harborTarget: number;
  remainingRolls: number;
};

const initialBoats: BoatInput[] = [
  {
    id: "jade",
    ware: "Jade",
    currentPosition: 7,
    harborTarget: 13,
    remainingRolls: 2,
  },
  {
    id: "silk",
    ware: "Silk",
    currentPosition: 7,
    harborTarget: 13,
    remainingRolls: 2,
  },
  {
    id: "ginseng",
    ware: "Ginseng",
    currentPosition: 7,
    harborTarget: 13,
    remainingRolls: 2,
  },
];

const numberFormatter = new Intl.NumberFormat("zh-Hant", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

function App() {
  const [boats, setBoats] = useState<BoatInput[]>(initialBoats);
  const [hasCalculated, setHasCalculated] = useState(false);

  const boatResults = boats.map((boat) => ({
    boat,
    result: calculateArrivalProbability({
      currentPosition: boat.currentPosition,
      harborTarget: boat.harborTarget,
      remainingRolls: boat.remainingRolls,
      diceSides: manilaDiceSides,
    }),
  }));

  const totalOutcomesLabel = boatResults
    .map(({ result }) => result.totalOutcomes)
    .join(" / ");

  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">Manila v0.1</p>
        <h1>船隻到港機率計算器</h1>
        <p className="intro">
          用三列下拉選單快速輸入本輪三艘船的局面。骰子固定為 Manila 的六面骰，系統會枚舉剩餘骰子結果。
        </p>
      </section>

      <div className="workspace-grid">
        <section className="calculator-card" aria-labelledby="calculator-title">
          <div className="section-heading">
            <h2 id="calculator-title">局面輸入</h2>
            <span>每船 {totalOutcomesLabel} 種結果</span>
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

          <button className="calculate-button" onClick={() => setHasCalculated(true)}>
            計算
          </button>
        </section>

        <section className="result-card" aria-live="polite">
          <div className="section-heading">
            <h2>計算結果</h2>
            <span>{hasCalculated ? "已更新" : "預設範例"}</span>
          </div>

          <div className="boat-result-list">
            {boatResults.map(({ boat, result }) => (
              <BoatResultCard boat={boat} key={boat.id} result={result} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

type BoatInputRowProps = {
  boat: BoatInput;
  index: number;
  onChange: (
    field: "currentPosition" | "harborTarget" | "remainingRolls",
    value: number,
  ) => void;
};

function BoatInputRow({ boat, index, onChange }: BoatInputRowProps) {
  return (
    <div className="boat-input-row">
      <div className="boat-name">
        <span>船 {index + 1}</span>
        <strong>{boat.ware}</strong>
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
      <SelectField
        label="剩餘骰子"
        value={boat.remainingRolls}
        options={remainingRollOptions}
        onChange={(value) => onChange("remainingRolls", value)}
      />
    </div>
  );
}

function updateBoat(
  index: number,
  field: "currentPosition" | "harborTarget" | "remainingRolls",
  value: number,
  setBoats: Dispatch<SetStateAction<BoatInput[]>>,
) {
  setBoats((currentBoats) =>
    currentBoats.map((boat, boatIndex) =>
      boatIndex === index ? { ...boat, [field]: value } : boat,
    ),
  );
}

type BoatResultCardProps = {
  boat: BoatInput;
  result: ProbabilityResult;
};

function BoatResultCard({ boat, result }: BoatResultCardProps) {
  const arrivalPercent = formatPercent(result.arrivalProbability);
  const failurePercent = formatPercent(result.failureProbability);

  return (
    <article className="boat-result-card">
      <div className="boat-result-heading">
        <div>
          <span>{boat.ware}</span>
          <h3>
            位置 {boat.currentPosition} → {boat.harborTarget}
          </h3>
        </div>
        <strong>剩 {boat.remainingRolls} 骰</strong>
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

function formatPercent(probability: number): string {
  return `${numberFormatter.format(probability * 100)}%`;
}

function formatPosition(position: string): string {
  return position.endsWith("_or_more")
    ? `${position.replace("_or_more", "")}+ 到港`
    : `位置 ${position}`;
}

export default App;
