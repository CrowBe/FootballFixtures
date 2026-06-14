# FootballFixtures — local live poller

A tiny, dependency-free Node script that drives live updates. It runs on a
machine **you** keep always-on, reads the schedule from the deployed server, and
triggers the server's `POST /poll` **only while a game is in its match window**.

Why this instead of a hosted scheduler: GitHub Actions cron is best-effort
(documented 5–30 min delays, a 5-minute floor, UTC-only, auto-disables after 60
days of repo inactivity), which is poor for live timing. A local process you
control is free, reliable as your own hardware, and can poll as often as you
like. (If you'd rather not run a local process, see the hosted fallback below.)

It is **competition-agnostic**: it only reads whatever `/schedule` returns, so
switching the app to a different cup/league needs no changes here.

## What it does

- Fetches `GET /schedule` (refreshed periodically) to learn kickoff times.
- Considers a game "active" from `kickoff − LEAD_MIN` to `kickoff + MATCH_WINDOW_MIN`.
- While any game is active, sends `POST /poll` every `LIVE_CADENCE_SEC`,
  authenticated with a shared secret. This drives live updates **and** keeps a
  sleepy free host (e.g. Render) warm for the match.
- While nothing is active, it idles until the next window opens.

## Prerequisites

- Node **18+** (uses the built-in `fetch`). Node **20.6+** can load the env file
  directly with `--env-file`.
- The server deployed, and a `POLL_SECRET` that **matches** the server's check.

## Configure

```bash
cp .env.example .env
# edit .env: set SERVER_URL and POLL_SECRET (and tunables if desired)
```

## Run

Node 20.6+ (loads `.env` for you):

```bash
node --env-file=.env poll.mjs
```

Older Node (export the vars first):

```bash
export $(grep -v '^#' .env | xargs) && node poll.mjs
```

## Keep it running durably

**pm2** (simple, restarts on crash/reboot):

```bash
npm i -g pm2
pm2 start poll.mjs --name ff-poller --node-args="--env-file=.env"
pm2 save && pm2 startup
```

**systemd** (Linux), `/etc/systemd/system/ff-poller.service`:

```ini
[Unit]
Description=FootballFixtures live poller
After=network-online.target

[Service]
WorkingDirectory=/path/to/poller
ExecStart=/usr/bin/node --env-file=/path/to/poller/.env /path/to/poller/poll.mjs
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now ff-poller
journalctl -u ff-poller -f   # watch logs
```

## Hosted fallback (no local process)

[cron-job.org](https://cron-job.org) is free, allows up to once-per-minute, and
is commonly used to keep free hosts awake. Create a job that sends `POST` to
`<SERVER_URL>/poll` with header `Authorization: Bearer <POLL_SECRET>`. The
trade-off vs. this script: it isn't schedule-aware, so either let the server
no-op cheaply outside match windows, or schedule it only during match hours.

## Notes

- The script expects `/schedule` to return games with an ISO `kickoff` and a
  finished/status hint. Keep those field names aligned with the server's shared
  contract once it exists.
- The server's `/poll` is idempotent enough that a missed or repeated tick is
  harmless (v1 accepts the rare duplicate notification).
