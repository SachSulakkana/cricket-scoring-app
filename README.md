# 🏏 CrickScore

CrickScore is a **ball-by-ball cricket scoring and tournament management system** built with **Next.js, React, and Cloud Firestore**.

It supports quick matches, structured tournaments, player/team management, and full scorecard analytics — all running locally with persistent storage.

---

## ✨ Features

### 🎯 Live Match Scoring
- Ball-by-ball scoring system
- Overs, innings, and strike rotation handling
- Dismissals (bowled, lbw, caught, run-out, etc.)
- Extras handling (wide, no-ball, bye, leg-bye)
- Undo last ball support
- Auto innings completion (overs / all-out / chase logic)

### ⚡ Quick Match Mode
- Fast setup without tournament rules
- Ad-hoc teams and players
- Full scorecard generation
- Save match history locally

### 🧑‍🤝‍🧑 Player & Team Management
- Global player registry (CRUD)
- Team creation with player assignment
- CSV import for bulk data
- Player sync across teams

### 🏆 Tournament System
- Multi-format tournaments:
  - Round Robin
  - League
  - Knockout
  - Group Stage
  - Playoffs
- Fixture generation engine
- Standings calculation with Net Run Rate (NRR)
- Stage progression automation
- Tournament templates and instances

### 📊 Scorecards & Analytics
- Batting & bowling tables
- Over-by-over breakdown
- Match summary view
- Tournament statistics

### 💾 Local-First Persistence
- SQLite database (better-sqlite3)
- Offline-first architecture
- Local draft recovery system
- Legacy localStorage migration support

---

## 🧱 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS 4
- **Language:** TypeScript 5.7
- **State Management:** Redux Toolkit + Context API
- **Database:** SQLite (better-sqlite3, WAL mode)
- **Forms:** react-hook-form + zod
- **UI Components:** Radix UI / shadcn-style components
- **Package Manager:** pnpm

---

## 🏗️ Architecture Overview

CrickScore is built using a **modular cricket domain architecture**:

- 🧠 Match Engine → ball-by-ball scoring logic  
- 🧑‍🤝‍🧑 Roster System → players & teams management  
- 🏆 Tournament Engine → fixtures, stages, standings  
- 💾 Persistence Layer → SQLite + API routes  
- 🎨 UI Layer → modular cricket UI components  

---

## 📂 Project Structure

```bash
boundary-xi/
├── app/                 # Next.js routes + API
│   ├── quick-match/
│   ├── players/
│   ├── teams/
│   ├── tournament/
│   └── api/
│
├── components/         # UI + feature components
├── hooks/              # Custom React hooks
├── lib/
│   ├── cricket-types.ts
│   ├── cricket-context.tsx
│   ├── sqlite-db.ts
│   ├── roster-storage.ts
│   ├── scorecard-stats.ts
│   └── tournament-stage-engine/
│
├── data/
│   └── cricket.db     # SQLite database (local)
└── public/
