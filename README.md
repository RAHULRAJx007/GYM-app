# GymCore — Gym Management App (Vercel + Supabase Free Tier)

Single-tenant per deployment. Create one Supabase project per gym on the **client's own account** (free tier: 500MB DB ~25k members, 1GB storage, 5GB egress). Hand over credentials.

## Quick Per-Client Setup (2 mins)

1. **Supabase**: Create project at supabase.com on client's account → SQL Editor → run `supabase/schema.sql`
2. **Auth**: Authentication → Add User (owner@gym.com / password) → copy URL + anon key from Project Settings → API
3. **Env**: Copy `.env.example` to `.env.local`
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
4. **Run**: `npm install && npm run dev` → login at `/login`
5. **Deploy**: Push to GitHub → import in Vercel → add same env vars → deploy (Hobby: 100GB bandwidth, 1M invocations free)

Free tier pauses after 1 week inactivity — keep a cron ping or upgrade to Pro $25/mo for production.

## Features

- Dashboard: total/active members, MTD revenue, expiring in 7 days, recent members
- Members: CRUD, search, status, detail with membership + payments + attendance
- Plans: monthly/quarterly/yearly, price/duration, active toggle
- Payments: manual cash/card/UPI/bank_transfer, receipts, history per member + global
- Attendance: quick check-in by search, recent log
- Settings: gym name/phone/address/currency
- Auth: Supabase email/password, protected `/dashboard`, middleware session refresh

## Tech

Next.js 16 (App Router, Turbopack), Tailwind v4, shadcn/ui, Supabase (Postgres + Auth + RLS), Vercel

## Limits (Free)

- **500 MB DB** → ~15-20 KB per member-year → 500 members → 40+ years. Real limit is 2 active projects per Supabase account (hence per-client account model).
- **Vercel Hobby** → 100 GB bandwidth/mo → ~100k-500k page loads, plenty for admin panel.

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run lint` — eslint
