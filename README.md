# FootballFixtures

A lightweight iOS + Android app for browsing the schedule, live scores, and standings — built competition-agnostic with World Cup 2026 as the first configured competition.

## Monorepo structure

```
packages/
  app/      — Expo (React Native) app with Expo Router
  server/   — Hono API (deployable to Render)
  shared/   — Shared TypeScript types (Competition, Game, Team, Standing, LiveState, payloads)
data/
  competitions/
    world-cup-2026.json   — Pinned openfootball snapshot (seed + accumulated results)
tools/
  poller/   — Schedule-aware live poller (runs on an always-on machine)
  enrich/   — One-off script to enrich the seed with provider fixture IDs
.github/
  workflows/
    seed-diff.yml         — Daily seed-diff → PR workflow
```

## Prerequisites

- **Node 18+** (the server, app, and tooling all rely on built-in `fetch`).
  Node **20.6+** is recommended so the poller can load its env file with
  `--env-file`.
- **npm 9+** (uses workspaces).
- For the mobile app: the **Expo Go** app on a phone, or an iOS Simulator /
  Android Emulator. A web preview also works for quick checks.

---

## Run it end to end, locally

The fastest path. **No API keys or external accounts are required** to browse the
app locally — the server serves the pinned World Cup 2026 snapshot
(`data/competitions/world-cup-2026.json`), which already contains the full
fixture list and results. Live polling and push notifications are optional
add-ons documented further down.

### 1. Install (also builds the shared package)

```bash
npm install
```

> `npm install` runs a `postinstall` that builds `packages/shared`. The server
> and app both import `@footballfixtures/shared` from its compiled output, so
> this step must happen before either will start. (If you ever wipe build
> artifacts, rebuild with `npm run build:shared`.)

### 2. Configure environment (optional for read-only browsing)

```bash
cp .env.example .env
```

You can leave every value blank for read-only local use. Fill them in only when
you want live data or push (see [Environment variables](#environment-variables)).

### 3. Start the server

```bash
npm run dev:server      # tsx watch on http://localhost:3000
```

Verify it's serving the seed:

```bash
curl -s localhost:3000/                 # {"ok":true,"service":"FootballFixtures API",...}
curl -s localhost:3000/schedule | head  # 104 games for World Cup 2026
curl -s localhost:3000/standings | head # 6 groups
curl -s localhost:3000/live             # [] until a game is live
```

### 4. Start the app

In a second terminal:

```bash
npm run dev:app         # expo start
```

Then press `i` (iOS Simulator), `a` (Android Emulator), `w` (web), or scan the
QR code with **Expo Go** on your phone.

- On a **simulator/emulator or web**, the app talks to
  `http://localhost:3000` automatically.
- On a **physical device**, `localhost` refers to the phone itself. Start Expo
  with your computer's LAN IP so the device can reach the server:

  ```bash
  EXPO_PUBLIC_SERVER_URL=http://192.168.1.50:3000 npm run dev:app
  ```

That's the full read path working end to end: the app fetches the schedule,
standings, live state, and game detail from your local server.

### 5. (Optional) Run the live poller against your local server

The poller drives live updates by calling the server's `POST /poll` during match
windows. To exercise it locally you need a `POLL_SECRET` set on **both** the
server and the poller, and (for real scores) an `API_FOOTBALL_KEY` on the server.

```bash
# In .env: set POLL_SECRET (and API_FOOTBALL_KEY for real live data), restart the server.
cd tools/poller
cp .env.example .env
# edit .env: SERVER_URL=http://localhost:3000 and the same POLL_SECRET
node --env-file=.env poll.mjs   # Node 20.6+
```

Outside a match window the poller simply idles and `POST /poll` no-ops, so this
is safe to run any time. See [`tools/poller/README.md`](tools/poller/README.md)
for durable deployment (pm2 / systemd) and tunables.

---

## Environment variables

All variables live in the root `.env` (copied from `.env.example`), except the
poller's, which live in `tools/poller/.env`. **Never commit `.env`.**

| Variable                   | Used by         | Required?                 | Purpose                                                                                                          |
| -------------------------- | --------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `API_FOOTBALL_KEY`         | server          | Optional                  | API-Football key for live scores. Blank → seed-only mode; `POST /poll` no-ops.                                   |
| `API_FOOTBALL_DAILY_LIMIT` | server          | Optional (default `90`)   | Safety cap on upstream calls per day (free tier ≈ 100/day).                                                      |
| `POLL_SECRET`              | server + poller | Required for polling      | Shared bearer secret protecting `POST /poll`. Must match on both sides.                                          |
| `PORT`                     | server          | Optional (default `3000`) | Port the Hono server listens on (Render sets this automatically).                                                |
| `EXPO_PROJECT_ID`          | app             | Required for push         | Expo/EAS project ID, written to `app.json` after `eas init`.                                                     |
| `EXPO_PUBLIC_SERVER_URL`   | app             | Optional                  | Server base URL baked into the bundle. Blank → `http://localhost:3000`. Set to your LAN IP for physical devices. |
| `SERVER_URL`               | poller          | Required                  | Base URL of the server the poller drives (e.g. `http://localhost:3000`).                                         |
| `REPO_DATA_PATH`           | poller          | Optional                  | Absolute path to `world-cup-2026.json`; when set, the poller commits final scores back.                          |

> **Expo note:** the Expo CLI reads `.env` from `packages/app/`, not the repo
> root. For the app, set `EXPO_PUBLIC_SERVER_URL` in `packages/app/.env` or inline
> it on the command line as shown above. Only variables prefixed `EXPO_PUBLIC_`
> are exposed to the client bundle.

---

## External service setup (only for live data + push)

None of this is needed to browse the app against the seed. Set it up when you
want real-time scores or push notifications.

### 1. API-Football (API-SPORTS) — live data

1. Sign up at <https://dashboard.api-football.com/>.
2. Copy the **API Key** from your account dashboard.
3. Put it in `.env` as `API_FOOTBALL_KEY=<your-key>` and restart the server.
4. **Free tier:** ~100 requests/day. The server only calls the API during live
   match windows (driven by the poller); all client requests are served from the
   server's in-memory cache, and `API_FOOTBALL_DAILY_LIMIT` guards the quota.

### 2. Expo / EAS — push notifications

1. Install the EAS CLI: `npm i -g eas-cli`
2. Log in: `eas login`
3. From `packages/app/`: `eas init` — creates/links the project and writes the
   `projectId` into `app.json`.
4. Also put the ID in `.env` as `EXPO_PROJECT_ID=<id>`.
5. Build a dev client: `npm run build:dev -w @footballfixtures/app`
   (`eas build --profile development --platform all`).
6. Push requires a **physical device** — the in-app code returns early on
   simulators (`Device.isDevice` check), and Expo Go can't receive Android push
   on SDK 53+.

### 3. Apple Developer Program (iOS push only)

> **Manual step:** Apple Developer Program membership costs $99/year USD.

1. Enrol at <https://developer.apple.com/programs/>.
2. Run `eas credentials` in `packages/app/` to let EAS manage your APNs key.

### 4. Render — server hosting

The repo ships a [`render.yaml`](render.yaml) blueprint.

1. Sign up at <https://render.com>.
2. Create a **Blueprint** from this repo (or a Web Service pointing at it). The
   blueprint already sets:
   - build: `npm install && npm run build -w packages/shared && npm run build -w packages/server`
   - start: `node packages/server/dist/index.js`
3. In the Render dashboard, set the secret env vars (`API_FOOTBALL_KEY`,
   `POLL_SECRET`) — they're marked `sync: false` in the blueprint.
4. **Free tier:** the service spins down after ~15 min idle. The poller keeps it
   warm during match windows; the app's local cache covers cold starts.

---

## Scripts

Run from the repo root:

```bash
npm run build         # Build shared + server (tsc --build)
npm run build:shared  # Build just the shared package
npm run dev:server    # Start the Hono server (tsx watch)
npm run dev:app       # Start the Expo app
npm run typecheck     # Type-check shared + server
npm run lint          # ESLint
npm run format        # Prettier (write)
npm run format:check  # Prettier (check only)
```

Per-package equivalents still work, e.g. `npm run dev -w @footballfixtures/server`.

## Assets

`packages/app/assets/` contains placeholder app icon, splash, adaptive icon, and
notification icon so the app bundles and EAS builds succeed out of the box.
Replace them with real artwork before shipping.

## Deployment

- **Server:** Render, via the [`render.yaml`](render.yaml) blueprint (see above).
- **App:** EAS builds (`npm run build:dev` / `npm run build:preview` in
  `packages/app`), then submit through the App Store / Play Store.
