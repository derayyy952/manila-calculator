# Manila Calculator

一個用於桌遊 **Manila** 的輕量網頁計算器。

線上網站：

https://derayyy952.github.io/manila-calculator/

這個工具的目標不是自動代替玩家做決策，也不是給出絕對最佳策略。它會列出機率、期望值 EV 和風險資訊，讓玩家在實際遊戲中更快判斷。

## 目前功能

- 計算 3 艘船的到港機率。
- 使用一個共用的剩餘骰子次數，因為三艘船會一起經歷同樣數量的骰子輪次。
- 可選棋盤上的貨物價值預設：
  - 黃色：18，坐船成本 1 / 2 / 3
  - 棕色：24，坐船成本 2 / 3 / 4
  - 藍色：30，坐船成本 3 / 4 / 5
  - 綠色：36，坐船成本 3 / 4 / 5 / 5
- 計算坐船位置 EV，支援同一艘船多人平分貨物收益。
- 計算通用下注位置 EV。
- 可展開海盜船分析，模型假設海盜只能搶 1 艘船。
- 支援手機使用，包含 iPhone 橫向 landscape 版面。

## 數學模型

### 船隻到港機率

對每艘船：

```text
最終位置 = 目前位置 + 骰子總和
到港 = 最終位置 >= 目標位置
```

程式會直接枚舉所有可能骰子結果，而不是使用封閉公式。

例如剩餘 2 顆六面骰：

```text
總結果數 = 6 × 6 = 36
到港機率 = 到港結果數 / 36
未到港機率 = 1 - 到港機率
```

程式也會列出最終位置分佈。任何到達或超過目標位置的結果會合併為：

```text
13+ 到港
```

### 坐船位置 EV

坐船位置使用該船的到港機率。坐船位置會決定成本；如果同一艘船有多名玩家，貨物收益會先平均分配：

```text
單人分得收益 = 貨物價值 / 船上人數
坐船 EV = 到港機率 × 單人分得收益 - 位置成本
```

例子：

```text
到港機率 = 72.22%
貨物價值 = 18
船上人數 = 2
單人分得收益 = 9
位置成本 = 1

EV = 0.7222 × 9 - 1 = +5.50
```

### 通用下注 EV

一般下注位置：

```text
EV = 成功機率 × 成功收益
   + 失敗機率 × 失敗收益
   - 成本
```

其中：

```text
失敗機率 = 1 - 成功機率
```

ROI：

```text
ROI = EV / 成本
```

盈虧平衡成功率：

```text
盈虧平衡成功率 = 成本 / (成功收益 - 失敗收益)
```

### 海盜船 EV

海盜船模型假設：

- 海盜只能搶 1 艘船。
- 如果多艘船到港，海盜會選擇可搶收益最高的到港船。
- 海盜玩家人數可以是 1 或 2。

程式會枚舉 3 艘船的 8 種到港 / 未到港情境：

```text
船 1：到港 / 未到港
船 2：到港 / 未到港
船 3：到港 / 未到港
```

每個情境：

```text
情境機率 = 各船到港或未到港機率的乘積
情境可搶收益 = 到港船之中最高的可搶收益
```

如果沒有船到港：

```text
情境可搶收益 = 0
```

期望可搶收益：

```text
期望可搶收益 = Σ(情境機率 × 情境可搶收益)
```

海盜 EV：

```text
單人期望收益 = 期望可搶收益 / 海盜玩家人數
海盜 EV = 單人期望收益 - 海盜成本
```

推薦使用簡單 EV 門檻：

```text
EV >= +5      => EV 支持搶
0 <= EV < +5  => 可考慮
EV < 0        => 不建議
```

這是一個簡化模型。它沒有包含心理戰、阻止對手的價值、股票影響或完整 house rule。

## 開發

安裝依賴：

```powershell
npm install
```

本地執行：

```powershell
npm run dev
```

執行測試：

```powershell
npm test
```

Build：

```powershell
npm run build
```

---

# Manila Calculator

A lightweight web calculator for the board game **Manila**.

Live site:

https://derayyy952.github.io/manila-calculator/

The goal is not to auto-play the game or give absolute strategy answers. The app shows probabilities, expected values, and risk indicators so players can make faster decisions during a real game.

## Current Features

- Calculate arrival probability for 3 ships.
- Use one shared remaining-dice input, because all ships advance through the same number of remaining dice rounds.
- Choose cargo value presets from the board:
  - Yellow: 18, seat costs 1 / 2 / 3
  - Brown: 24, seat costs 2 / 3 / 4
  - Blue: 30, seat costs 3 / 4 / 5
  - Green: 36, seat costs 3 / 4 / 5 / 5
- Calculate boat-seat EV, including shared cargo payout when multiple players are on the same ship.
- Calculate generic betting-position EV.
- Optional pirate-ship analysis, assuming pirates can steal only 1 ship.
- Mobile-friendly layout, including landscape mode for iPhone.

## Math Model

### Ship Arrival Probability

For each ship:

```text
final position = current position + dice sum
arrival = final position >= harbor target
```

The app enumerates all possible dice outcomes instead of using a closed-form formula.

Example with 2 remaining six-sided dice:

```text
total outcomes = 6 × 6 = 36
arrival probability = arrival outcomes / 36
failure probability = 1 - arrival probability
```

The app also groups final positions into a probability distribution. Any result at or above the harbor target is grouped as:

```text
13+ arrival
```

### Boat Seat EV

Boat seats use the selected ship's arrival probability. The selected seat determines the cost. If multiple players are on the same ship, the cargo value is divided first:

```text
personal payout = cargo value / passenger count
seat EV = arrival probability × personal payout - seat cost
```

Example:

```text
arrival probability = 72.22%
cargo value = 18
passenger count = 2
personal payout = 9
seat cost = 1

EV = 0.7222 × 9 - 1 = +5.50
```

### Generic Betting EV

For a general betting position:

```text
EV = success probability × success payout
   + failure probability × failure payout
   - cost
```

Where:

```text
failure probability = 1 - success probability
```

ROI:

```text
ROI = EV / cost
```

Break-even success probability:

```text
break-even probability = cost / (success payout - failure payout)
```

### Pirate Ship EV

The pirate model assumes:

- Pirates can steal only 1 ship.
- If multiple ships arrive, pirates choose the arrived ship with the highest stealable value.
- Pirate players can be 1 or 2.

The app enumerates all 8 arrival/failure scenarios for 3 ships:

```text
ship 1: arrive / fail
ship 2: arrive / fail
ship 3: arrive / fail
```

For each scenario:

```text
scenario probability = product of each ship's arrival or failure probability
scenario loot = max(arrived ships' stealable values)
```

If no ship arrives:

```text
scenario loot = 0
```

Expected loot:

```text
expected loot = sum(scenario probability × scenario loot)
```

Pirate EV:

```text
expected loot per pirate = expected loot / pirate player count
pirate EV = expected loot per pirate - pirate cost
```

The recommendation uses a simple EV threshold:

```text
EV >= +5      => EV supports taking pirate
0 <= EV < +5  => Consider
EV < 0        => Not recommended
```

This is a simplified model. It does not include psychology, blocking value, or stock effects.

## Development

Install dependencies:

```powershell
npm install
```

Run locally:

```powershell
npm run dev
```

Run tests:

```powershell
npm test
```

Build:

```powershell
npm run build
```
