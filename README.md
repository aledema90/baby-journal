<div align="center">

# 🍼 Baby Journal

**A small, friendly app to log and share your baby's daily care with a co-parent.**

Track feedings, sleep, diapers, weight and supplements — synced in real time
across both parents' phones.

[![License: MIT](https://img.shields.io/badge/License-MIT-ec4899.svg)](./LICENSE)
![React](https://img.shields.io/badge/React-18-149eca.svg)
![Vite](https://img.shields.io/badge/Vite-8-646cff.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)
![Supabase](https://img.shields.io/badge/Supabase-3ecf8e.svg)

</div>

---

## ✨ Features

- 📆 **Daily log** — record feedings, sleep and diaper changes in a couple of taps
- 🗓️ **Calendar view** — see the whole month at a glance with per-day activity dots
- ⚖️ **Weight tracking** — plot growth over time on a simple chart
- 💧 **Supplement drops** — keep track of vitamins and supplements
- 👨‍👩‍👧 **Co-parent sharing** — invite the other parent with a code and stay in sync in real time
- 🌍 **Bilingual** — full Italian and English UI
- 🔐 **Email or Google sign-in** — powered by Supabase Auth
- 📱 **Installable PWA** — add it to your home screen and use it like a native app

## 📸 Screenshots

> Add images to [`docs/screenshots/`](./docs/screenshots) — see that folder's
> README for the expected filenames.

<div align="center">

| Today | Calendar | Weight |
| :---: | :---: | :---: |
| ![Daily log](./docs/screenshots/today.png) | ![Calendar](./docs/screenshots/calendar.png) | ![Weight chart](./docs/screenshots/weight.png) |

</div>

## 🧰 Tech stack

| Area | Choice |
| --- | --- |
| UI | React 18 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS + [shadcn/ui](https://ui.shadcn.com) |
| Data & auth | [Supabase](https://supabase.com) (Postgres + Realtime + Auth) |
| Data fetching | TanStack Query |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Testing | Vitest + Testing Library |

## 🚀 Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# then fill in your Supabase project values (see below)

# 3. Start the dev server
npm run dev            # http://localhost:8080
```

### Environment variables

The app reads these from `.env` (all are client-side `VITE_` values):

| Variable | Description |
| --- | --- |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ref/id |

## 📜 Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run the test suite once (Vitest) |
| `npm run test:watch` | Run tests in watch mode |

## 📁 Project structure

```
src/
├── components/      # UI components (incl. shadcn/ui primitives)
├── hooks/           # Auth, baby context, data hooks
├── integrations/    # Supabase client & generated types
├── lib/             # i18n and utilities
├── pages/           # Route-level screens
└── test/            # Test setup
supabase/            # SQL / migrations
```

## 📄 License

[MIT](./LICENSE) © 2026 Alessandro De Marchis
