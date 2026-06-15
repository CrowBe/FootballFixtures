# FootballFixtures — API-Football enrichment

A one-shot script that fetches the WC 2026 fixture list from API-Football and
writes each fixture's numeric ID into `data/competitions/world-cup-2026.json`
as `game.providerIds['api-football']`.

The live layer (Milestone 3) uses these IDs to call `GET /fixtures?id=X` for
targeted live polling. Without them, it would have to re-fetch the full fixture
list on every poll cycle, burning your 100 requests/day quota.

## When to run

- Once, shortly after the tournament starts (fixtures are assigned IDs).
- After any schedule change that adds new fixtures (e.g. bracket resolution) —
  re-run to enrich the new games.
- Safe to re-run at any time: already-matched games are skipped unless you
  pass `--force`.

## Setup

```bash
cp .env.example .env
# edit .env: paste your API_FOOTBALL_KEY
```

## Run

Node 20.6+ (loads `.env` for you):

```bash
node --env-file=.env enrich.mjs
```

Older Node:

```bash
export $(grep -v '^#' .env | xargs) && node enrich.mjs
```

npm shortcut (from this directory):

```bash
npm run enrich:envfile
```

## Flags

| Flag | Effect |
|---|---|
| `--dry-run` | Show what would change without writing |
| `--force`   | Re-enrich already-matched games (overwrites existing IDs) |

## Troubleshooting unmatched fixtures

If any fixtures are unmatched, the script will print the normalised team IDs it
derived from the API-Football names. Compare them against the team IDs in
`data/competitions/world-cup-2026.json` and add any missing entry to the
`TEAM_NAME_MAP` in `enrich.mjs`:

```js
const TEAM_NAME_MAP = new Map([
  // ...
  ['api football name normalised', 'our-team-id'],
]);
```

Then re-run.

## What gets written

Each matched game gets a `providerIds` field added (or updated):

```json
{
  "id": "wc2026-001",
  "providerIds": { "api-football": "867894" },
  ...
}
```

If a second data provider is added later, its ID sits alongside:

```json
{
  "providerIds": { "api-football": "867894", "sofascore": "12345" }
}
```

The live adapter reads `game.providerIds['api-football']` when polling.
