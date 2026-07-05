# CrickScore

CrickScore is a **ball-by-ball cricket scoring and tournament management system** built with **Next.js, React, and Cloud Firestore**.

It supports quick matches, structured tournaments, player/team management, live spectator views, and full scorecard analytics.

---

## Features

### Live Match Scoring
- Ball-by-ball scoring, extras, dismissals, undo
- Auto innings completion (overs / all-out / chase)
- Super over support

### Quick Match Mode
- Manual setup or roster team picker
- Rain abandon
- Save and delete match history

### Player and Team Management
- Global player registry (CRUD)
- Teams with player assignment and CSV import

### Tournament System
- Round robin, league, knockout, group stage, playoffs
- Fixture generation, NRR standings, stage progression
- Per-fixture spectator deep links

### Scorecards and Analytics
- Batting and bowling tables, over-by-over breakdown, tournament stats

---

## Tech Stack

- Next.js 16 (App Router), React 19, TypeScript 5.7
- Redux Toolkit + Context API
- Cloud Firestore (Firebase Admin SDK on API routes)
- Tailwind CSS 4, Radix UI, zod

---

## Getting Started

1. Copy `.env.example` to `.env.local` and fill in Firebase credentials.
2. `pnpm install`
3. `pnpm dev`
4. Optional: set `CRICKET_API_SECRET` on the server and the same value under **Settings → API access**.

---

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Development server |
| `pnpm build` | Production build |
| `pnpm typecheck` | TypeScript check |
| `pnpm test` | Unit tests |
| `pnpm lint` | ESLint |

---

## API Security

Mutating API routes accept an optional shared secret via `Authorization: Bearer …` or `x-api-key`. When `CRICKET_API_SECRET` is unset, auth is disabled for local development. Set it before public deployment.
