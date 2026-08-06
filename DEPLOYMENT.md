# Self-hosting on your own VPS + domain

This app is normally deployed to Vercel (see the main [README](README.md)). This guide covers the alternative: running it yourself on a VPS, behind your own domain, via Docker. Nothing here is required if you're happy on Vercel — this is purely for "I want it on my own box."

## What's different from Vercel

Vercel gives you a few things for free that a bare VPS doesn't, so this guide replaces each of them:

| Vercel feature | VPS replacement |
| --- | --- |
| Auto-deploy on every `git push` | A small poll-and-rebuild script + cron (Step 6) |
| HTTPS + custom domain, zero config | Caddy reverse proxy with automatic Let's Encrypt certs (Step 4) |
| Daily cron for `/api/cron/snapshot` | A regular crontab entry (Step 5) |
| Serverless functions | A single long-running Node process (`docker compose up`) |

Everything else — baha24/gold-api/oilpriceapi/RapidAPI fetches, the GitHub-committed price history, Upstash-backed push notifications, the GitHub Actions push-check workflow — works identically regardless of where the app itself is hosted.

## Prerequisites

- A VPS (any provider) with **Docker** and the **Docker Compose plugin** installed (`docker compose version` should work — most current distros' Docker install already includes it).
- A domain name, with an **A record** (and **AAAA** if the VPS has IPv6) pointed at the VPS's IP address.
- Ports **80** and **443** open and reachable from the internet (needed for Let's Encrypt's HTTP-01 challenge and for HTTPS itself).
- The same env vars documented in the README's setup sections (`GH_COMMIT_TOKEN`, `OILPRICEAPI_KEY`, push-notification vars, etc.) — all optional, same as on Vercel; the app runs fine with none of them, those categories/features just stay hidden/off.

## Step 1 — Get the code onto the VPS

```bash
git clone https://github.com/DeepInkGroup/Gheymat.git
cd Gheymat
```

## Step 2 — Environment variables

```bash
cp .env.example .env
nano .env   # fill in whichever optional features you want
```

Same file, same variables as `.env.local` for local dev — see the README for what each one unlocks. Leave any of them blank to just skip that feature.

## Step 3 — Build and start the container

```bash
docker compose up -d --build
```

This builds the image (multi-stage `Dockerfile`, using `output: "standalone"` from `next.config.ts` for a minimal runtime) and starts it listening on `127.0.0.1:3000` — not exposed to the internet directly, on purpose (see Step 4).

Check it's actually up:

```bash
curl -s http://127.0.0.1:3000/api/prices | head -c 200
docker compose logs -f gheymat   # Ctrl+C to stop following
```

## Step 4 — Reverse proxy + HTTPS (Caddy)

[Caddy](https://caddyserver.com/) gets you automatic Let's Encrypt HTTPS with a 3-line config — no certbot, no manual renewal. Install it (e.g. `apt install caddy` on Debian/Ubuntu — see [Caddy's install docs](https://caddyserver.com/docs/install) for your distro), then edit `/etc/caddy/Caddyfile` — this repo's [`Caddyfile`](Caddyfile) is a starting point:

```
your-domain.com {
	reverse_proxy 127.0.0.1:3000
}
```

Replace `your-domain.com` with your real domain, then:

```bash
sudo cp Caddyfile /etc/caddy/Caddyfile   # after editing the domain
sudo systemctl reload caddy
```

Caddy handles the certificate automatically on first request. Visit `https://your-domain.com` — if it loads, HTTPS is working (this matters: PWA install requires HTTPS).

Prefer nginx + certbot instead? That works too — just proxy_pass to `http://127.0.0.1:3000` and run certbot as usual; not covered in detail here since Caddy is the path of least resistance for a fresh box.

## Step 5 — Daily price history snapshot

Vercel's own cron feature drove `/api/cron/snapshot` once a day (see `vercel.json` — irrelevant here, Vercel-only). On a VPS, use a regular crontab entry instead:

```bash
crontab -e
```

Add (adjust the domain and secret):

```cron
0 3 * * * curl -sf -X GET "https://your-domain.com/api/cron/snapshot" -H "Authorization: Bearer $CRON_SECRET" >> /var/log/gheymat-snapshot.log 2>&1
```

Use the same `CRON_SECRET` value you put in `.env`. If you left `CRON_SECRET` blank, drop the `-H` header — the endpoint just skips the check when it's unset (see the README's price-history section for why setting it is still recommended).

## Step 6 — Keep it updated (poll + rebuild)

Unlike Vercel, this box doesn't automatically redeploy when something pushes to `main` — including the daily snapshot cron's own commits, which is what actually keeps your price history current. [`scripts/deploy.sh`](scripts/deploy.sh) handles both: it pulls, and only rebuilds/restarts the container if something actually changed.

```bash
chmod +x scripts/deploy.sh
crontab -e
```

Add:

```cron
*/15 * * * * /path/to/Gheymat/scripts/deploy.sh >> /var/log/gheymat-deploy.log 2>&1
```

Every 15 minutes it checks for new commits (your own pushes, or the daily snapshot's) and rebuilds only when there's something new — a plain `git pull` with no changes exits immediately, so this is cheap to run often.

## Step 7 — Push notifications workflow (if you're moving off Vercel)

[`.github/workflows/push-check.yml`](.github/workflows/push-check.yml) currently pings `https://gheymat.vercel.app/api/cron/push-check`. If this VPS is replacing Vercel (not running alongside it), update that URL to your domain — otherwise leave it as-is if Vercel stays live too.

## Firewall

If the VPS provider doesn't already lock this down, make sure only what's needed is open:

```bash
sudo ufw allow 22/tcp    # SSH — don't lock yourself out
sudo ufw allow 80/tcp    # HTTP (Let's Encrypt challenge + redirect)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

Note port 3000 is deliberately **not** opened — the app only listens on `127.0.0.1`, reachable exclusively through Caddy.

## Updating manually

If you'd rather not wait for the cron in Step 6:

```bash
cd Gheymat
git pull
docker compose up -d --build
```

## Troubleshooting

- **`docker compose up` fails to build** — check `docker compose logs gheymat`; most likely a missing/misspelled env var referenced at build time (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`), or an npm install failure (check your VPS has enough RAM — 1GB+ recommended for the build step).
- **Site loads over HTTP but not HTTPS** — Caddy couldn't complete the Let's Encrypt challenge; almost always DNS not pointed at the VPS yet, or port 80 blocked. Check `sudo journalctl -u caddy -f` while requesting the domain.
- **History / push notifications not working** — same as on Vercel: check the relevant env vars in `.env` are actually set, and that `docker compose up -d --build` was re-run after editing `.env` (env changes need a container restart to take effect).
- **Price history not updating day to day** — confirm the Step 5 crontab entry is actually installed (`crontab -l`) and check `/var/log/gheymat-snapshot.log`; then confirm Step 6's redeploy cron is picking up the resulting commits (`/var/log/gheymat-deploy.log`).
