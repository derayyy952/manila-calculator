import { useState } from "react";
import { calculateArrivalProbability } from "./lib/probability";

const currentPositionOptions = Array.from({ length: 13 }, (_, index) => index);
const harborTargetOptions = [10, 11, 12, 13, 14, 15];
const remainingRollOptions = [0, 1, 2, 3];
const diceSideOptions = [4, 6, 8, 10, 12];

const numberFormatter = new Intl.NumberFormat("zh-Hant", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

function App() {
  const [currentPosition, setCurrentPosition] = useState(7);
  const [harborTarget, setHarborTarget] = useState(13);
  const [remainingRolls, setRemainingRolls] = useState(2);
  const [diceSides, setDiceSides] = useState(6);
  const [hasCalculated, setHasCalculated] = useState(false);

  const result = calculateArrivalProbability({
    currentPosition,
    harborTarget,
    remainingRolls,
    diceSides,
  });

  const arrivalPercent = formatPercent(result.arrivalProbability);
  const failurePercent = formatPercent(result.failureProbability);

  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">Manila v0.1</p>
        <h1>船隻到港機率計算器</h1>
        <p className="intro">
          用下拉選單快速輸入目前局面，枚舉剩餘骰子結果，計算船隻成功到港與停在各位置的機率。
        </p>
      </section>

      <section className="calculator-card" aria-labelledby="calculator-title">
        <div className="section-heading">
          <h2 id="calculator-title">局面輸入</h2>
          <span>{result.totalOutcomes} 種骰子結果</span>
        </div>

        <div className="input-grid">
          <SelectField
            label="目前位置"
            value={currentPosition}
            options={currentPositionOptions}
            onChange={setCurrentPosition}
          />
          <SelectField
            label="目標位置"
            value={harborTarget}
            options={harborTargetOptions}
            onChange={setHarborTarget}
          />
          <SelectField
            label="剩餘骰子次數"
            value={remainingRolls}
            options={remainingRollOptions}
            onChange={setRemainingRolls}
          />
          <SelectField
            label="骰子面數"
            value={diceSides}
            options={diceSideOptions}
            onChange={setDiceSides}
          />
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

        <div className="probability-grid">
          <ResultTile label="到港機率" value={arrivalPercent} tone="arrival" />
          <ResultTile label="未到港機率" value={failurePercent} tone="failure" />
        </div>

        <div className="distribution-panel">
          <h3>最終位置分佈</h3>
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
      </section>
    </main>
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
