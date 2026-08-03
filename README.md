# Gheymat

Live prices for major currencies, gold, coins and crypto — in Toman — sourced from [baha24.com](https://baha24.com). Built with Next.js, installable as a PWA on iPhone with an automatic frosted-glass UI in standalone mode.

**[🔴 Live preview](https://deepinkgroup.github.io/gheymat/)** (static snapshot — see note below) · **[📄 Project page / showcase](https://deepinkgroup.github.io/gheymat/showcase/)**

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

- [`src/lib/baha24.ts`](src/lib/baha24.ts) — server-side fetch from `https://baha24.com/api/v1/price`, cached for 45s. If the baha24 request fails for any reason (rate limit, error), it falls back to the last good snapshot or a seed dataset so the UI is never empty.
- [`src/app/api/prices/route.ts`](src/app/api/prices/route.ts) — internal route that decouples the client from calling baha24 directly (keeps any API token server-side, and keeps visitor traffic from burning through baha24's free-tier quota).
- [`src/components/PricesBoard.tsx`](src/components/PricesBoard.tsx) — polls `/api/prices` (never baha24 directly) every 20s.
- [`src/lib/symbols.ts`](src/lib/symbols.ts) — metadata for all 28 tracked instruments (name, category, unit, icon/flag, brand color).
- [`src/app/globals.css`](src/app/globals.css) — design tokens; glassmorphism overrides activate automatically when the app detects it's running as an installed iOS PWA (`display-mode: standalone`).

### API token (optional)

baha24 has a free, unauthenticated tier (rate-limited to ~20 requests per window), which is enough for this app's server-side caching layer. If you buy a baha24 API subscription, drop the token into `.env.local`:

```
BAHA24_API_TOKEN=your-token-here
```

No code changes needed — requests automatically switch to sending an `Authorization: Bearer` header.

## PWA on iPhone

The site ships a `manifest.webmanifest`, Apple touch icons, and a service worker (`public/sw.js`) that caches the app shell and last-known prices for offline viewing.

**Install:** Safari → Share → Add to Home Screen.

## Deploy

Works on any Next.js host (e.g. Vercel):

```bash
npm run build
npm start
```

### About the GitHub Pages preview

GitHub Pages only serves static files — it can't run this app's API proxy route or dynamic icon generation. `docs/index.html` is a hand-built static clone of the real UI (same design, same icons, a baked-in price snapshot) so the repo has a working visual preview with no backend required. It doesn't poll for live prices. For a fully live deployment, point Vercel (or any Node host) at this repo.

---

DeepInk Group
