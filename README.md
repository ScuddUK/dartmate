# DartMate

Professional dart scoring application with a TV scoreboard and mobile scorer. Designed for paired sessions with clean win logic, leg/set management, and a streamlined start flow.

## Highlights
- TV scoreboard with player names, scores, legs/sets, and stats.
- Mobile scorer input paired via session code.
- Mobile‑only post‑match controls: restart or change settings from phone.
- Victory screen on the scoreboard shows winner and match‑long average.
- Accurate match‑long averages (`totalScore`, `totalThrows`, `matchAverageScore`).
- Best‑of and first‑to formats with legs and optional sets.
- Alternating starting player per leg; bust handling; undo support.
- Optional DartBot with realistic throw patterns.

## Recent Changes (v0.8.1)
- Mobile post‑match screen offering `Start Again` and `Change Game Settings` on phone only.
- Scoreboard victory screen no longer displays restart controls.
- Match‑long averages tracked across valid throws (including bot throws); displayed on victory.
- Session start flow keeps mobile on mobile view after starting, while standalone scoreboard switches to scoreboard.

## Development
- `npm run dev` — run Vite client and Node server concurrently.
- Client runs on `http://localhost:3000` (or next free port); server on `http://localhost:3001`.

## Deployment
See `DEPLOYMENT.md` and IONOS guides in `ionos-deployment/` for options.

## Roadmap
- Quick starter selection on MobilePostMatch.
- Confirm dialog before restart.
- Persist settings per session.