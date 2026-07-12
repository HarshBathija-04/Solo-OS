# SOLO OS

A real-life RPG progression operating system with **one shared backend** and **two frontends**.

## Structure

```
Solo-OS/
├── Website/        # Next.js (App Router) + Prisma + PostgreSQL + NextAuth — the canonical backend + web app
└── Mobile app/     # Expo / React Native — local-first, syncs to the website's REST API
```

## Architecture

- **Canonical backend**: the `Website` app owns the database (Prisma + PostgreSQL/Supabase) and exposes a REST API under `/api/*`.
- **Web frontend**: server components + server actions → service layer → Prisma. Authenticated with NextAuth (cookie session).
- **Mobile frontend**: local-first Zustand stores that sync to the same backend over REST using a JWT bearer token (from `/api/auth/login`). Works fully offline; syncs when signed in.
- **Timetable** is fully relational and shared by both frontends (`TimetableBlock` / `TimetableBlockLog` / `StudyLog`).
- **Core game state** syncs cross-device via a per-user JSON snapshot (`/api/state`).

## Getting started

### Website
```bash
cd Website
cp .env.example .env      # fill DATABASE_URL, DIRECT_URL, AUTH_SECRET, AUTH_URL
npm install
npx prisma generate && npx prisma db push
npm run dev               # http://localhost:3000
```

### Mobile app
```bash
cd "Mobile app"
cp .env.example .env      # set EXPO_PUBLIC_API_BASE_URL to your running website
npm install
npx expo start
```

> On a physical device, set `EXPO_PUBLIC_API_BASE_URL` to your computer's LAN IP (not `localhost`).

## Notes
- `.env` files are git-ignored — never commit real secrets.
- `AUTH_SECRET` signs both the NextAuth web session and the mobile bearer tokens.
