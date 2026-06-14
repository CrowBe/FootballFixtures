# FootballFixtures

A lightweight iOS + Android app for browsing the schedule, live scores, and standings — built competition-agnostic with World Cup 2026 as the first configured competition.

## Monorepo structure

```
packages/
  app/      — Expo (React Native) app with Expo Router
  server/   — Hono API deployed to Render
  shared/   — Shared TypeScript types (Competition, Game, Team, Standing, LiveState, payloads)
data/
  competitions/
    world-cup-2026.json   — Pinned openfootball snapshot (seed + accumulated results)
tools/
  poller/   — Schedule-aware live poller (runs on an always-on machine)
.github/
  workflows/
    seed-diff.yml         — Daily seed-diff → PR workflow
```

## Prerequisites

- Node 18+
- npm 9+ (workspaces)

## Setup

```bash
# 1. Install all workspace deps
npm install

# 2. Copy the root env example and fill in values
cp .env.example .env

# 3. Copy the poller env example
cp tools/poller/.env.example tools/poller/.env
```

## Development

```bash
# Start the Hono server (packages/server)
npm run dev -w packages/server

# Start the Expo app (packages/app)
npm run start -w packages/app

# Type-check all packages
npm run typecheck

# Lint
npm run lint

# Format
npm run format
```

## Running the live poller

See [`tools/poller/README.md`](tools/poller/README.md) for full instructions. Quick start:

```bash
cd tools/poller
cp .env.example .env
# edit .env: set SERVER_URL and POLL_SECRET
node --env-file=.env poll.mjs
```

## External service setup checklist

### 1. API-Football (API-SPORTS) — live data

1. Sign up at <https://dashboard.api-football.com/>
2. Under your account, copy the **API Key** from the dashboard.
3. Paste it into `.env` as `API_FOOTBALL_KEY=<your-key>`.
4. **Free tier:** ~100 requests/day. The server only polls during live match windows; all client requests are served from the server's cache.

### 2. Render — server hosting

1. Sign up at <https://render.com>.
2. Create a new **Web Service**, point it at this repo, set the build/start commands (see `packages/server/README.md`).
3. Add env vars (`API_FOOTBALL_KEY`, `POLL_SECRET`, `PORT`) in the Render dashboard.
4. **Free tier behavior:** the service spins down after ~15 min idle. The local poller keeps it warm during match windows; the app's local cache handles off-hours cold starts.

### 3. Expo / EAS — push notifications

1. Install EAS CLI: `npm i -g eas-cli`
2. Log in: `eas login`
3. In `packages/app/`: `eas init` — this creates/links the project and writes the `projectId` to `app.json`.
4. Paste the project ID into `.env` as `EXPO_PROJECT_ID=<id>`.
5. Build a dev build: `eas build --profile development --platform all`
6. Push requires a **physical device** (not the Expo Go client for Android SDK 53+).

### 4. Apple Developer Program (iOS push)

> **Manual step required:** Apple Developer Program membership costs $99/year USD.

1. Enrol at <https://developer.apple.com/programs/>.
2. After enrolment, run `eas credentials` in `packages/app/` to let EAS manage your APNs key automatically.

## Deployment

See individual package READMEs for deploy-specific instructions.
