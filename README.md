# Gheymat

Live prices for major currencies, gold, coins and crypto — in Toman — sourced from [baha24.com](https://baha24.com). Built with Next.js, installable as a PWA on iPhone with an automatic frosted-glass UI in standalone mode.

**[🔴 Live app](https://gheymat.vercel.app/)** (real, updates every 10s) · **[📄 Project page / showcase](https://deepinkgroup.github.io/gheymat/showcase/)**

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

- [`src/lib/baha24.ts`](src/lib/baha24.ts) — server-side fetch from `https://baha24.com/api/v1/price` (a flat array with a `sell` price field per symbol — not documented anywhere, confirmed by hitting it directly), cached for 30s. baha24 sends no change/percent field, so each symbol's delta is computed by comparing its price across our own polls. If the baha24 request fails for any reason (rate limit, error), it falls back to the last good snapshot or a seed dataset so the UI is never empty.
- [`src/app/api/prices/route.ts`](src/app/api/prices/route.ts) — internal route that decouples the client from calling baha24 directly (keeps any API token server-side, and keeps visitor traffic from burning through baha24's free-tier quota).
- [`src/components/PricesBoard.tsx`](src/components/PricesBoard.tsx) — polls `/api/prices` (never baha24 directly) every 10s.
- [`src/lib/symbols.ts`](src/lib/symbols.ts) — metadata for all 28 tracked instruments (name, category, unit, icon/flag, brand color).
- [`src/lib/useHiddenSymbols.ts`](src/lib/useHiddenSymbols.ts) — per-instrument show/hide preference (settings panel), persisted to `localStorage`. Crypto defaults to only Tether + Bitcoin shown; everything else starts hidden.
- [`src/app/globals.css`](src/app/globals.css) — design tokens; glassmorphism overrides activate automatically when the app detects it's running as an installed iOS PWA (`display-mode: standalone`).
- [`data/DatabaseCurrency.json`](data/DatabaseCurrency.json), [`DatabaseGold.json`](data/DatabaseGold.json), [`DatabaseCrypto.json`](data/DatabaseCrypto.json) — price history, one JSON file per category (`{ "USD": [{"t":..,"p":..}, ...] }`). Plain files committed to the repo, not a database service — Vercel's serverless filesystem doesn't persist writes between requests, so the only durable way to "save to a local file" here is to have the cron job commit the updated file straight to git, which then redeploys with the new data baked in. [`src/lib/history-db.ts`](src/lib/history-db.ts) reads them from the deployed bundle; [`src/lib/githubRepo.ts`](src/lib/githubRepo.ts) does the actual commit via GitHub's API. [`src/app/api/cron/snapshot/route.ts`](src/app/api/cron/snapshot/route.ts) runs it daily (see `vercel.json`); [`src/app/api/history/[symbol]/route.ts`](<src/app/api/history/[symbol]/route.ts>) serves it to the "History" view on each card. With no `GH_COMMIT_TOKEN` configured, the cron job just skips (files stay empty) instead of breaking.
- [`src/app/api/movers/route.ts`](src/app/api/movers/route.ts) + [`src/components/MoversStrip.tsx`](src/components/MoversStrip.tsx) — "Today's Movers": current live price vs. each symbol's latest stored history point, ranked by |% change|. Empty (and hidden) until history has at least one snapshot.
- [`src/lib/useMoveSound.ts`](src/lib/useMoveSound.ts) — an opt-in (off by default) synthesized tone via Web Audio for the single biggest move each poll. Deliberately website-only: `play()` no-ops when `<html>` has the `standalone` class (installed PWA).

### API token (optional)

baha24 has a free, unauthenticated tier (rate-limited to ~20 requests per window), which is enough for this app's server-side caching layer. If you buy a baha24 API subscription, drop the token into `.env.local`:

```
BAHA24_API_TOKEN=your-token-here
```

No code changes needed — requests automatically switch to sending an `Authorization: Bearer` header.

### Price history (optional)

To enable the "History" view (multi-day chart per instrument) instead of "not enough data yet":

1. Generate a GitHub **fine-grained personal access token** ([github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new)) scoped to **only this repository**, with **Contents: Read and write** permission. A fine-grained token limited to this one repo is much safer than a classic PAT with broad account access.
2. In Vercel → this project → **Settings → Environment Variables**, add `GH_COMMIT_TOKEN` with that token's value, then redeploy.
3. (Recommended) Also set `CRON_SECRET` to any random string — it's checked against the `Authorization` header on the cron request so random visitors can't trigger snapshot writes.
4. Check the **Cron Jobs** tab after deploying to confirm `/api/cron/snapshot` is scheduled.

Commits show up authored by whichever GitHub account owns the token — consider a dedicated bot account if you'd rather it not be your personal one. `vercel.json` schedules one snapshot a day (`0 3 * * *`) — that's the hard limit on Vercel's Hobby plan (more frequent expressions **fail the entire deployment**, not just the cron job — this bit us once already). Upgrade to Pro for per-minute cron if you want finer-grained history. History starts empty and fills in one point per day as the cron job runs and commits — there's no way to backfill the past.

## PWA on iPhone

The site ships a `manifest.webmanifest`, Apple touch icons, and a service worker (`public/sw.js`) that caches the app shell and last-known prices for offline viewing.

**Install:** Safari → Share → Add to Home Screen.

## Deploy

Live at **[gheymat.vercel.app](https://gheymat.vercel.app/)**, deployed straight from this repo's `main` branch. Works on any Next.js host:

```bash
npm run build
npm start
```

### About the GitHub Pages project page

GitHub Pages only serves static files — it can't run this app's API proxy route or dynamic icon generation, so it can't host the real app. [`deepinkgroup.github.io/gheymat`](https://deepinkgroup.github.io/gheymat/) redirects straight to the live Vercel app; [`/showcase`](https://deepinkgroup.github.io/gheymat/showcase/) has the project overview and links into the source.

---

DeepInk Group
