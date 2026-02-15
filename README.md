# Chess Competition App

A local-first web app to run a chess competition with:

- **Player management** (add, remove, reset)
- **Lottery pairing** (randomly shuffles players each round)
- **Color switch** (alternates white/black assignments every new round)
- **Round tracking** and quick result entry
- **Standings table** sorted by points and tie-breaks

## Run locally

No build step required.

### Option 1: Open directly

Open `index.html` in your browser.

### Option 2: Use a local web server (recommended)

```bash
python3 -m http.server 8000
```

Then open: <http://localhost:8000>

## How it works

1. Add players in the **Players** section.
2. Click **Start Tournament** to generate the first random pairings.
3. Enter results for each board:
   - `1-0` (White wins)
   - `0-1` (Black wins)
   - `½-½` (Draw)
4. Click **Complete Round** to lock the round and update standings.
5. Click **Next Round (Lottery + Color Switch)** to generate a new random round.

### Color switch rule

Each new round flips color assignment direction globally:

- Odd switch state: first player in a pair is White.
- Even switch state: first player in a pair is Black.

This makes colors rotate naturally between rounds.

## Files

- `index.html` – UI structure
- `styles.css` – layout and styling
- `app.js` – tournament logic
