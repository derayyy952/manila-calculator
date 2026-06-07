# Manila 機率與收益計算器：Codex 開發需求草案

## 1. 專案目標

製作一個用於桌遊《Manila》的「機率 + 收益」輔助計算器。

第一版不要做成 AI 策略助手，而是做成清晰、可靠、可手動輸入局面的工具：

- 計算船隻到港機率
- 計算各下注位置的期望值 EV
- 計算股票持倉對決策的影響
- 最終延伸為船長決策模擬器

核心理念：

```text
不要直接告訴玩家「最佳行動」，
而是列出每個選項的成功率、EV、股票影響和風險，
讓玩家自己判斷。
```

---

## 2. 遊戲模型簡化假設

先按照常見規則建立模型：

- 每輪有 3 艘船出航，1 種貨物不出航
- 船長 / 港務長可以買 1 張股票
- 船長決定哪 3 種貨物出航，以及各船初始位置
- 每輪有 3 次骰子移動
- 每次移動後根據位置判斷：
  - 到港
  - 未到港
  - 是否停在海盜相關位置
- 股票價格因貨物是否成功到港而改變

注意：不同版本或玩家 house rule 可能有差異，因此所有關鍵數值應該可配置。

例如：

```ts
const config = {
  pirateCost: 5,
  diceSides: 6,
  movementRounds: 3,
  harborTarget: 13,
  minSharePrice: 5,
};
```

---

## 3. 核心概念：EV

EV = Expected Value，期望值。

簡化公式：

```text
EV = 成功機率 × 成功收益 + 失敗機率 × 失敗收益 - 成本
```

如果失敗收益是 0：

```text
EV = 成功機率 × 成功收益 - 成本
```

在《Manila》中，實際 EV 應分成三層：

```text
總EV = 現金EV + 股票EV + 控制權價值 - 成本
```

第一版先做現金 EV，之後再逐步加入股票和船長控制權。

---

## 4. 版本規劃

# v0.1：船隻成功率計算器

## 目標

回答：

```text
某艘船從目前位置出發，剩餘 N 次骰子後，到港機率是多少？
```

## 輸入

- 船目前位置 `currentPosition`
- 目標位置 `harborTarget`
- 剩餘骰子次數 `remainingRolls`
- 骰子面數 `diceSides`

範例：

```json
{
  "currentPosition": 5,
  "harborTarget": 13,
  "remainingRolls": 2,
  "diceSides": 6
}
```

## 輸出

- 到港機率
- 未到港機率
- 各最終位置機率分佈

範例：

```json
{
  "arrivalProbability": 0.5833,
  "failureProbability": 0.4167,
  "finalPositionDistribution": {
    "7": 0.0278,
    "8": 0.0556,
    "9": 0.0833,
    "10": 0.1111,
    "11": 0.1389,
    "12": 0.1667,
    "13_or_more": 0.4167
  }
}
```

## 實作建議

不用寫複雜公式，直接枚舉骰子結果。

```ts
function enumerateRollSums(remainingRolls: number, diceSides: number): number[] {
  // 回傳所有可能的骰子總和，例如 remainingRolls=2 時共有 36 個結果
}

function calculateArrivalProbability(
  currentPosition: number,
  harborTarget: number,
  remainingRolls: number,
  diceSides: number
): ProbabilityResult {
  // 枚舉所有骰子總和
  // 判斷 currentPosition + sum >= harborTarget
}
```

## UI

簡單表單：

```text
目前位置：[ 5 ]
剩餘骰數：[ 2 ]
目標格：[ 13 ]

[計算]

到港機率：58.33%
未到港機率：41.67%
```

---

# v0.2：下注位置 EV 計算器

## 目標

回答：

```text
某個位置值不值得放？
```

## 輸入

- 成功機率 `successProbability`
- 成功收益 `successPayout`
- 失敗收益 `failurePayout`
- 成本 `cost`

範例：

```json
{
  "successProbability": 0.4,
  "successPayout": 30,
  "failurePayout": 0,
  "cost": 5
}
```

## 輸出

- 現金 EV
- ROI
- 盈虧平衡成功率

```text
EV = 0.4 × 30 - 5 = +7
ROI = 7 / 5 = 140%
盈虧平衡成功率 = 5 / 30 = 16.67%
```

## 實作函數

```ts
function calculateCashEV(input: EVInput): EVResult {
  const failProbability = 1 - input.successProbability;
  const ev =
    input.successProbability * input.successPayout +
    failProbability * input.failurePayout -
    input.cost;

  const roi = ev / input.cost;
  const breakEvenProbability = input.cost / (input.successPayout - input.failurePayout);

  return { ev, roi, breakEvenProbability };
}
```

## UI

表格展示不同位置：

| 位置 | 成本 | 成功率 | 成功收益 | EV | ROI |
|---|---:|---:|---:|---:|---:|
| Jade 船位 | 5 | 58.3% | 20 | +6.66 | 133% |
| 海盜 | 5 | 40.0% | 30 | +7.00 | 140% |
| 修船廠 | 4 | 41.7% | 12 | +1.00 | 25% |

---

# v0.3：海盜模組

## 目標

因為你們的海盜位是固定 5 元，所以海盜 EV 可以獨立做成一個清晰模組。

## 輸入

- 海盜成本，預設 5
- 成功機率
- 可搶收益
- 是否多人海盜
- 分錢方式

範例：

```json
{
  "pirateCost": 5,
  "successProbability": 0.35,
  "lootValue": 40,
  "pirateCount": 2
}
```

## 計算

```text
單人海盜收益 = 可搶收益 / 海盜人數
海盜EV = 成功機率 × 單人海盜收益 - 5
```

範例：

```text
0.35 × (40 / 2) - 5 = +2
```

## UI

```text
海盜成本：5
成功機率：35%
可搶總收益：40
海盜人數：2

單人期望收益：+2
```

## 注意

海盜難點不是成本，而是「成功收益」很難自動估。

所以第一版建議讓玩家手動輸入可搶收益，之後再考慮從船上下注自動推算。

---

# v0.4：股票持倉模組

## 目標

回答：

```text
如果某貨物成功到港，我的股票期望收益是多少？
```

## 輸入

- 每種貨物目前股價
- 玩家持有股票數量
- 成功後股價增加值
- 失敗後股價變化，通常可以先設為 0
- 貨物到港機率

範例：

```json
{
  "ware": "Jade",
  "sharesOwned": 4,
  "currentPrice": 15,
  "priceIncreaseOnArrival": 5,
  "priceChangeOnFailure": 0,
  "arrivalProbability": 0.6
}
```

## 計算

```text
股票EV = 到港機率 × 持股數 × 成功升值
       + 未到港機率 × 持股數 × 失敗變化
```

如果失敗不跌價：

```text
股票EV = 到港機率 × 持股數 × 成功升值
```

範例：

```text
0.6 × 4 × 5 = +12
```

## UI

| 貨物 | 持股 | 到港率 | 成功升值 | 股票EV |
|---|---:|---:|---:|---:|
| Jade | 4 | 60% | +5 | +12 |
| Silk | 1 | 40% | +5 | +2 |
| Ginseng | 0 | 55% | +5 | 0 |

---

# v0.5：總 EV 排名

## 目標

把現金 EV 和股票 EV 合併。

```text
總EV = 現金EV + 股票EV
```

## 輸出範例

| 行動 | 現金EV | 股票EV | 總EV | 評價 |
|---|---:|---:|---:|---|
| Jade 船位 | +6.6 | +12.0 | +18.6 | 強 |
| 海盜 | +7.0 | -3.0 | +4.0 | 可考慮 |
| Silk 船位 | +4.2 | +2.0 | +6.2 | 普通 |

## 注意

股票 EV 可能是負的。

例如你放海盜令 Jade 失敗，而你自己持有很多 Jade 股票，雖然海盜現金 EV 高，但總 EV 可能下降。

---

# v0.6：局面保存

## 目標

讓使用者不用每次重新輸入。

## 功能

- 保存玩家名稱
- 保存持股狀態
- 保存目前股價
- 保存當前船隻位置
- 保存 house rules

## 技術

先用 `localStorage`。

```ts
function saveGameState(state: GameState) {
  localStorage.setItem("manila-game-state", JSON.stringify(state));
}

function loadGameState(): GameState | null {
  const raw = localStorage.getItem("manila-game-state");
  return raw ? JSON.parse(raw) : null;
}
```

---

# v1.0：船長決策模擬器

## 目標

這是最有價值的版本。

回答：

```text
如果我是船長，我應該讓哪三種貨物出航？
每艘船應該放在哪個初始位置？
```

## 輸入

- 玩家持股
- 每種貨物目前股價
- 可選貨物
- 可配置初始位置
- 船長拍賣成本
- 每種貨物到港後的升值
- 可用下注位置

## 輸出

| 船長方案 | 現金EV | 股票EV | 總EV | 說明 |
|---|---:|---:|---:|---|
| Jade + Silk + Ginseng | +8 | +18 | +26 | 偏向自己持股 |
| Jade + Silk + Nutmeg | +10 | +12 | +22 | 現金位較好 |
| Silk + Ginseng + Nutmeg | +6 | +4 | +10 | 不建議 |

## 船長最高拍價估算

```text
船長最高合理拍價 ≈ 當船長總EV - 不當船長可得EV
```

簡化版：

```text
船長價值 ≈ 可額外提高的股票EV + 可額外取得的最佳下注EV
```

範例：

```text
當船長後總EV = 35
不當船長預期EV = 12
最高合理拍價 ≈ 23
```

## 注意

這不是絕對答案。

因為《Manila》還有心理戰和阻止對手的價值。

所以 UI 應顯示：

```text
建議最高拍價：23
保守拍價：15–18
激進拍價：20–25
```

---

## 5. 資料結構建議

```ts
type Ware = "Jade" | "Silk" | "Ginseng" | "Nutmeg";

type ShareState = {
  ware: Ware;
  currentPrice: number;
  priceIncreaseOnArrival: number;
};

type PlayerState = {
  id: string;
  name: string;
  cash: number;
  shares: Record<Ware, number>;
};

type BoatState = {
  ware: Ware;
  currentPosition: number;
  remainingRolls: number;
};

type GameConfig = {
  diceSides: number;
  movementRounds: number;
  harborTarget: number;
  pirateCost: number;
  minSharePrice: number;
};

type GameState = {
  config: GameConfig;
  players: PlayerState[];
  shares: Record<Ware, ShareState>;
  boats: BoatState[];
};

type EVBreakdown = {
  cashEV: number;
  stockEV: number;
  totalEV: number;
  successProbability: number;
  riskNote?: string;
};
```

---

## 6. 技術路線

## 最推薦

```text
HTML + TypeScript + Vite + localStorage
```

原因：

- Windows 可直接開發
- 可部署為 Web App
- 手機瀏覽器可用
- 之後可以轉 PWA
- 不需要一開始處理 iOS App Store

## 可選 UI

簡單版：

```text
Vite + React + TypeScript
```

如果想更快：

```text
Vite + Vanilla TypeScript
```

我建議先用 React，因為之後狀態管理和表格會更容易。

---

## 7. 建議資料夾結構

```text
manila-calculator/
  src/
    components/
      BoatProbabilityPanel.tsx
      EVTable.tsx
      PirateCalculator.tsx
      StockPanel.tsx
      CaptainSimulator.tsx
    lib/
      probability.ts
      ev.ts
      stock.ts
      captain.ts
      storage.ts
    types/
      game.ts
    App.tsx
    main.tsx
  package.json
  README.md
```

---

## 8. 開發優先級

## 第一階段

- [ ] 建立 Vite + React + TypeScript 專案
- [ ] 建立基本 GameConfig
- [ ] 完成骰子枚舉函數
- [ ] 完成船到港機率計算
- [ ] 顯示單艘船成功率

## 第二階段

- [ ] 加入下注 EV 計算
- [ ] 加入 ROI
- [ ] 加入盈虧平衡成功率
- [ ] 用表格排序 EV

## 第三階段

- [ ] 加入海盜固定成本 5 元
- [ ] 支援手動輸入可搶收益
- [ ] 支援多人海盜分錢

## 第四階段

- [ ] 加入股票持倉
- [ ] 計算股票 EV
- [ ] 合併現金 EV + 股票 EV

## 第五階段

- [ ] 加入局面保存
- [ ] 支援多玩家輸入
- [ ] 支援 house rule 配置

## 第六階段

- [ ] 船長決策模擬器
- [ ] 比較不同出航組合
- [ ] 估算船長最高合理拍價

---

## 9. 測試案例

## 測試 1：單次骰子

```text
目前位置 10，目標 13，剩餘 1 次骰子
需要骰出 3 或以上
成功率 = 4/6 = 66.67%
```

## 測試 2：兩次骰子

```text
目前位置 7，目標 13，剩餘 2 次骰子
需要總和 6 或以上
2D6 中小於 6 的組合為：2,3,4,5，共 10 種
成功率 = 26/36 = 72.22%
```

## 測試 3：海盜 EV

```text
海盜成本 = 5
成功率 = 40%
可搶收益 = 30
海盜人數 = 1
EV = 0.4 × 30 - 5 = +7
```

## 測試 4：股票 EV

```text
持有 Jade 4 張
Jade 到港率 = 60%
成功後每股 +5
股票EV = 0.6 × 4 × 5 = +12
```

## 測試 5：總 EV

```text
某 Jade 船位：
現金EV = +6
股票EV = +12
總EV = +18
```

---

## 10. 不建議第一版做的功能

暫時不要做：

- AI 自動策略建議
- 自動識別棋盤相片
- 多人線上同步
- iOS 原生 App
- 複雜心理戰模型
- 完整對手手牌推理

原因：

這些功能會拖慢開發，而且不一定提升第一版實用性。

第一版最重要是：

```text
算得準、輸入快、結果清楚。
```

---

## 11. 最終產品方向

理想完成版不是單純計算器，而是：

```text
Manila Decision Dashboard
```

包含：

- 船成功率
- 各下注位置 EV
- 股票影響
- 海盜收益
- 船長拍價範圍
- 風險提示

最終界面應該像這樣：

```text
目前最佳行動：Jade 船位
總EV：+18.6
成功率：58.3%
現金EV：+6.6
股票EV：+12.0
風險：如果 Jade 未到港，你仍然損失位置成本，但股票不跌價。
```

---

## 12. 給 Codex 的第一個任務

請先實作 v0.1。

要求：

1. 使用 Vite + React + TypeScript
2. 建立 `probability.ts`
3. 實作骰子枚舉
4. 實作船到港機率計算
5. 建立簡單 UI：
   - 目前位置
   - 目標位置
   - 剩餘骰子次數
   - 計算按鈕
   - 顯示成功率、失敗率、最終位置分佈
6. 寫 2–3 個基本測試案例

不要先做股票、海盜、船長模擬器。

先確保機率引擎正確。
