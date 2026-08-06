# Gheymat

Live prices for major currencies, gold, coins and crypto — in Toman — sourced from [baha24.com](https://baha24.com). Built with Next.js, installable as a PWA on iPhone with an automatic frosted-glass UI in standalone mode.

**[🔴 Live app](https://gheymat.vercel.app/)** (real, updates every 10s) · **[📄 Project page / showcase](https://deepinkgroup.github.io/Gheymat/showcase/)**

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
- [`src/lib/symbols.ts`](src/lib/symbols.ts) — metadata for all 49 tracked instruments (name, category, unit, icon/flag, brand color).
- [`src/lib/goldApi.ts`](src/lib/goldApi.ts) — server-side fetch from [gold-api.com](https://gold-api.com/docs) for Silver (XAG), Gold spot (XAU), Copper (HG) and Palladium (XPD); free, unauthenticated, no rate limit. Same self-measured-delta approach as baha24.ts.
- [`src/lib/oilApi.ts`](src/lib/oilApi.ts) — "Energy & Commodities" category: WTI, Brent, natural gas, diesel, heating oil, jet fuel, gasoline and coal via [oilpriceapi.com](https://docs.oilpriceapi.com/). No batch endpoint, so all 8 codes are fetched individually — cached ~40 min server-side to stay well under the account's monthly request budget. Needs `OILPRICEAPI_KEY`; the category is just empty without it.
- [`src/lib/rapidGoldApi.ts`](src/lib/rapidGoldApi.ts) — "Gold Purity" category: 24k/22k/21k/18k/14k/12k/9k gold priced per gram, plus ounce and pound, via the `real-time-metal-prices` RapidAPI. One request returns every rate; cached ~2h server-side to stay under a 500 requests/month plan. Needs `RAPIDAPI_METAL_KEY`; the category is just empty without it.
- [`src/lib/allPrices.ts`](src/lib/allPrices.ts) — merges baha24 with all three of the above into one list for `/api/prices` and the daily history snapshot. Every instrument from these four extra sources starts hidden — opt in per-instrument from settings.
- [`src/lib/useHiddenSymbols.ts`](src/lib/useHiddenSymbols.ts) — per-instrument show/hide preference (settings panel), persisted to `localStorage`. Crypto defaults to only Tether + Bitcoin shown; everything else starts hidden.
- [`src/app/globals.css`](src/app/globals.css) — design tokens; glassmorphism overrides activate automatically when the app detects it's running as an installed iOS PWA (`display-mode: standalone`).
- [`data/DatabaseCurrency.json`](data/DatabaseCurrency.json), [`DatabaseGold.json`](data/DatabaseGold.json), [`DatabaseCrypto.json`](data/DatabaseCrypto.json), [`DatabaseEnergy.json`](data/DatabaseEnergy.json), [`DatabaseGoldPurity.json`](data/DatabaseGoldPurity.json) — price history, one JSON file per category (`{ "USD": [{"t":..,"p":..}, ...] }`). Plain files committed to the repo, not a database service — Vercel's serverless filesystem doesn't persist writes between requests, so the only durable way to "save to a local file" here is to have the cron job commit the updated file straight to git, which then redeploys with the new data baked in. [`src/lib/history-db.ts`](src/lib/history-db.ts) reads them from the deployed bundle; [`src/lib/githubRepo.ts`](src/lib/githubRepo.ts) does the actual commit via GitHub's API. [`src/app/api/cron/snapshot/route.ts`](src/app/api/cron/snapshot/route.ts) runs it daily (see `vercel.json`); [`src/app/api/history/[symbol]/route.ts`](<src/app/api/history/[symbol]/route.ts>) serves it to the "History" view on each card. With no `GH_COMMIT_TOKEN` configured, the cron job just skips (files stay empty) instead of breaking.
- [`src/app/api/movers/route.ts`](src/app/api/movers/route.ts) + [`src/components/MoversStrip.tsx`](src/components/MoversStrip.tsx) — "Today's Movers": current live price vs. each symbol's latest stored history point, ranked by |% change|. Empty (and hidden) until history has at least one snapshot.
- [`src/lib/useMoveSound.ts`](src/lib/useMoveSound.ts) — an opt-in (off by default) synthesized tone via Web Audio for the single biggest move each poll. Deliberately website-only: `play()` no-ops when `<html>` has the `standalone` class (installed PWA), and its own settings toggle is hidden there too via the `hide-standalone` CSS class.
- Big move notifications (opt-in, off by default) — reuses the same per-poll biggest-mover detection as the sound cue but with a higher threshold and fires a browser `Notification` instead. Unlike sound, this works in both website and installed-PWA modes — pushes are genuinely useful in an app context. Only fires while a tab/the app is open and polling.
- [`src/lib/usePushSubscription.ts`](src/lib/usePushSubscription.ts) — background push notifications (opt-in, off by default): unlike the setting above, these arrive even when the app/tab is closed, via the Web Push API. [`src/lib/pushStore.ts`](src/lib/pushStore.ts) persists subscriptions + per-instrument alert targets in Upstash Redis (not git — this data churns often and each subscription URL is somewhat sensitive); [`src/app/api/cron/push-check/route.ts`](src/app/api/cron/push-check/route.ts) is the actual sender, diffing current prices against its last run and pushing for big moves / crossed alerts. Needs `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` — see "Background push notifications" below. Without them, the toggle for it just doesn't appear in settings.
- Manual refresh — the refresh icon next to search calls the same `loadPrices()` used by the 10s poll, so it's always in sync with live polling rather than a separate code path.
- [`src/components/ConverterModal.tsx`](src/components/ConverterModal.tsx) + [`src/lib/convert.ts`](src/lib/convert.ts) — convert an amount of any tracked instrument into every other one at once. USD/USDT-denominated instruments bridge through the live USD/USDT rate (itself Toman-denominated) to get a common unit, same trick used everywhere else in the app. Results are labeled with the target's own ticker, not its raw quote currency — those aren't the same thing (e.g. Tether's own price field is Toman-denominated, but "amount of Tether" should read "USDT", not "Toman").

### API token (optional)

baha24 has a free, unauthenticated tier (rate-limited to ~20 requests per window), which is enough for this app's server-side caching layer. If you buy a baha24 API subscription, drop the token into `.env.local`:

```
BAHA24_API_TOKEN=your-token-here
```

No code changes needed — requests automatically switch to sending an `Authorization: Bearer` header.

### Energy & Gold Purity feeds (optional)

Two more categories, each gated behind its own key — without them the category is just always empty and stays hidden:

- **Energy & Commodities** (WTI, Brent, natural gas, diesel, heating oil, jet fuel, gasoline, coal) needs `OILPRICEAPI_KEY` — get one at [docs.oilpriceapi.com](https://docs.oilpriceapi.com/). Watch your plan's actual quota: the key this was built against was on a **7-day professional trial** (10,000 requests over 7 days, per the `x-ratelimit-*` response headers), not a recurring monthly allowance — whatever it settles on after the trial ends, keep `CACHE_TTL_MS` in `src/lib/oilApi.ts` tuned so `8 codes × (30 days × 86400 / TTL_seconds)` stays comfortably under that.
- **Gold Purity** (24k–9k per gram, ounce, pound) needs `RAPIDAPI_METAL_KEY` — subscribe to the `real-time-metal-prices` API on RapidAPI. The plan this was built against caps at 500 requests/month (`X-RateLimit-Requests-Limit` header); the 2h cache in `src/lib/rapidGoldApi.ts` keeps usage to ~360/month.

Add both to `.env.local` for local dev, and to Vercel → this project → **Settings → Environment Variables** (then redeploy) for production.

### Price history (optional)

To enable the "History" view (multi-day chart per instrument) instead of "not enough data yet":

1. Generate a GitHub **fine-grained personal access token** ([github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new)) scoped to **only this repository**, with **Contents: Read and write** permission. A fine-grained token limited to this one repo is much safer than a classic PAT with broad account access.
2. In Vercel → this project → **Settings → Environment Variables**, add `GH_COMMIT_TOKEN` with that token's value, then redeploy.
3. (Recommended) Also set `CRON_SECRET` to any random string — it's checked against the `Authorization` header on the cron request so random visitors can't trigger snapshot writes.
4. Check the **Cron Jobs** tab after deploying to confirm `/api/cron/snapshot` is scheduled.

Commits show up authored by whichever GitHub account owns the token — consider a dedicated bot account if you'd rather it not be your personal one. `vercel.json` schedules one snapshot a day (`0 3 * * *`) — that's the hard limit on Vercel's Hobby plan (more frequent expressions **fail the entire deployment**, not just the cron job — this bit us once already). Upgrade to Pro for per-minute cron if you want finer-grained history. History starts empty and fills in one point per day as the cron job runs and commits — there's no way to backfill the past.

### Background push notifications (optional)

Alerts and big-move notifications that arrive even when the app is closed, not just while a tab is open polling. Five things to set up:

1. **VAPID keypair** (identifies this server to push services — not a third-party account):
   ```bash
   node -e "console.log(require('web-push').generateVAPIDKeys())"
   ```
   Set `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` to the two values, and `NEXT_PUBLIC_VAPID_PUBLIC_KEY` to the **same** public key again (it needs the `NEXT_PUBLIC_` prefix to reach the browser, which needs it to create a subscription — it's meant to be public). Also set `VAPID_SUBJECT` to your site URL or a `mailto:` address.
2. **Upstash Redis** for subscriptions + alert targets (why not git: this data churns often, and each subscription contains a somewhat sensitive endpoint URL — neither belongs in this repo's public history the way price snapshots do). Sign up free at [upstash.com](https://upstash.com), create a Redis database, and copy `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` from its **REST API** tab.
3. Add all five env vars above to Vercel → this project → **Settings → Environment Variables**, then redeploy.
4. **[`.github/workflows/push-check.yml`](.github/workflows/push-check.yml)** pings `/api/cron/push-check` every 5 minutes via a free GitHub Actions schedule — Vercel Hobby's own cron only allows once/day, too coarse for this. Add `CRON_SECRET` (same one from the price-history section above; set one if you skipped that) as a **repository secret**: this repo's Settings → Secrets and variables → Actions → New repository secret.
5. Nothing else — the "Push notifications (background)" toggle in Settings only appears once `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is set and the browser supports the Push API.

## PWA on iPhone

The site ships a `manifest.webmanifest`, Apple touch icons, and a service worker (`public/sw.js`) that caches the app shell and last-known prices for offline viewing.

**Install:** Safari → Share → Add to Home Screen.

## Deploy

Live at **[gheymat.vercel.app](https://gheymat.vercel.app/)**, deployed straight from this repo's `main` branch. Works on any Next.js host:

```bash
npm run build
npm start
```

### Self-hosting on your own VPS + domain

Want it on your own server instead? See **[DEPLOYMENT.md](DEPLOYMENT.md)** — Docker (`Dockerfile` + `docker-compose.yml`), a Caddy reverse proxy for automatic HTTPS, and replacements for the two things Vercel gives you for free (auto-deploy-on-push and daily cron).

### About the GitHub Pages project page

GitHub Pages only serves static files — it can't run this app's API proxy route or dynamic icon generation, so it can't host the real app. [`deepinkgroup.github.io/Gheymat`](https://deepinkgroup.github.io/Gheymat/) redirects straight to the live Vercel app; [`/showcase`](https://deepinkgroup.github.io/Gheymat/showcase/) has the project overview and links into the source.

---

DeepInk Group
