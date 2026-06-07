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
- Calculate boat-seat EV.
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

Boat seats use the selected ship's arrival probability:

```text
seat EV = arrival probability × cargo value - seat cost
```

Example:

```text
arrival probability = 72.22%
cargo value = 18
seat cost = 1

EV = 0.7222 × 18 - 1 = +12.00
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
