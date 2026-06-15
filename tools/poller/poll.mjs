#!/usr/bin/env node
// FootballFixtures — local live poller
// -----------------------------------------------------------------------------
// Runs on an always-on machine you control. It reads the schedule from the
// deployed server and triggers the server's POST /poll only while a game is in
// its match window. This both drives live updates and keeps a free (sleepy)
// Render box warm during games; off-hours it idles.
//
// Competition-agnostic: it makes NO assumptions about the World Cup. It simply
// reads whatever /schedule returns, so it needs zero changes if you later point
// the app at a different cup or league.
//
// Zero dependencies. Requires Node >= 18 (global fetch). Node >= 20.6 can load
// the env file with `node --env-file=.env poll.mjs` (see README).
// -----------------------------------------------------------------------------

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname } from 'node:path';

const SERVER_URL    = (process.env.SERVER_URL || '').replace(/\/+$/, '');
const POLL_SECRET   = process.env.POLL_SECRET || '';
const REPO_DATA_PATH = process.env.REPO_DATA_PATH || '';  // absolute path to world-cup-2026.json

// Tunables (all overridable via env)
const LIVE_CADENCE_SEC     = num(process.env.LIVE_CADENCE_SEC, 60);   // how often to hit /poll during a window
const LEAD_MIN             = num(process.env.LEAD_MIN, 5);            // start a window this many min before kickoff
const MATCH_WINDOW_MIN     = num(process.env.MATCH_WINDOW_MIN, 130);  // keep window open this long after kickoff (90' + HT + stoppage + buffer)
const SCHEDULE_REFRESH_MIN = num(process.env.SCHEDULE_REFRESH_MIN, 30); // re-fetch /schedule at least this often
const IDLE_RECHECK_MAX_MIN = num(process.env.IDLE_RECHECK_MAX_MIN, 15); // never sleep longer than this while idle

if (!SERVER_URL || !POLL_SECRET) {
  console.error('Missing SERVER_URL or POLL_SECRET. Copy .env.example to .env, fill it in, then run (see README.md).');
  process.exit(1);
}

let schedule = [];
let scheduleFetchedAt = 0;

function num(v, d) { const n = Number(v); return Number.isFinite(n) ? n : d; }
function log(...a) { console.log(new Date().toISOString(), ...a); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchSchedule() {
  const res = await fetch(`${SERVER_URL}/schedule`, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`GET /schedule -> ${res.status}`);
  const data = await res.json();
  const games = Array.isArray(data) ? data : (data.games ?? []);
  schedule = games
    .map((g) => ({
      id: g.id,
      kickoff: Date.parse(g.kickoff ?? g.kickoffAt ?? g.date ?? ''),
      finished: g.finished === true || g.status === 'FT' || g.status === 'finished',
    }))
    .filter((g) => Number.isFinite(g.kickoff));
  scheduleFetchedAt = Date.now();
  log(`schedule refreshed: ${schedule.length} dated games`);
}

function windowState(now) {
  const leadMs = LEAD_MIN * 60_000;
  const tailMs = MATCH_WINDOW_MIN * 60_000;
  let active = false;
  let nextOpenAt = null;
  for (const g of schedule) {
    if (g.finished) continue;
    const open = g.kickoff - leadMs;
    const close = g.kickoff + tailMs;
    if (now >= open && now <= close) active = true;
    else if (open > now) nextOpenAt = nextOpenAt == null ? open : Math.min(nextOpenAt, open);
  }
  return { active, nextOpenAt };
}

// ---- Write-back: commit final scores to the competition JSON ----------------

async function writeBackFinalScores(finalizedGames) {
  if (!REPO_DATA_PATH || finalizedGames.length === 0) return;

  try {
    const seed = JSON.parse(readFileSync(REPO_DATA_PATH, 'utf-8'));
    let changed = 0;
    const names = [];

    for (const fg of finalizedGames) {
      const game = seed.games.find((g) => g.id === fg.id);
      if (!game) { log(`write-back: game ${fg.id} not found in seed — skipping`); continue; }
      game.status = fg.status;
      game.homeScore = fg.homeScore;
      game.awayScore = fg.awayScore;
      game.finished = true;
      names.push(`${game.homeTeam.name} ${fg.homeScore}-${fg.awayScore} ${game.awayTeam.name}`);
      changed++;
    }

    if (changed === 0) return;

    writeFileSync(REPO_DATA_PATH, JSON.stringify(seed, null, 2) + '\n', 'utf-8');

    const repoDir = dirname(REPO_DATA_PATH);
    const summary = names.join(', ').slice(0, 100);
    const msg = `results: ${summary}`;

    execSync(`git -C "${repoDir}" add "${REPO_DATA_PATH}"`, { stdio: 'pipe' });
    execSync(`git -C "${repoDir}" commit -m "${msg.replace(/"/g, "'")}"`, { stdio: 'pipe' });
    execSync(`git -C "${repoDir}" push`, { stdio: 'pipe' });

    log(`write-back: committed and pushed ${changed} result(s) — ${summary}`);
  } catch (e) {
    log('write-back error:', e?.message ?? e);
  }
}

// ---- Poll -------------------------------------------------------------------

async function triggerPoll() {
  try {
    const res = await fetch(`${SERVER_URL}/poll`, {
      method: 'POST',
      headers: { authorization: `Bearer ${POLL_SECRET}`, 'content-type': 'application/json' },
      body: '{}',
    });

    if (!res.ok) {
      log(`poll FAILED (${res.status})`);
      return;
    }

    const body = await res.json().catch(() => ({}));
    log(`poll ok — checked=${body.gamesChecked ?? '?'} events=${body.eventsEmitted ?? '?'} finalized=${body.finalizedGames?.length ?? 0}`);

    if (body.finalizedGames?.length > 0) {
      await writeBackFinalScores(body.finalizedGames);
    }
  } catch (e) {
    log('poll error:', e?.message ?? e);
  }
}

// ---- Main loop --------------------------------------------------------------

async function main() {
  log(`poller starting -> ${SERVER_URL}  (live cadence ${LIVE_CADENCE_SEC}s)`);
  if (REPO_DATA_PATH) log(`write-back enabled -> ${REPO_DATA_PATH}`);
  else log('write-back disabled (REPO_DATA_PATH not set)');

  process.on('SIGINT', () => { log('stopping'); process.exit(0); });
  process.on('SIGTERM', () => { log('stopping'); process.exit(0); });

  for (;;) {
    if (Date.now() - scheduleFetchedAt > SCHEDULE_REFRESH_MIN * 60_000) {
      try { await fetchSchedule(); }
      catch (e) { log('schedule refresh error:', e?.message ?? e); }
    }

    const now = Date.now();
    const { active, nextOpenAt } = windowState(now);

    if (active) {
      await triggerPoll();
      await sleep(LIVE_CADENCE_SEC * 1000);
    } else {
      const capMs = IDLE_RECHECK_MAX_MIN * 60_000;
      const untilNext = nextOpenAt != null ? Math.max(0, nextOpenAt - now) : capMs;
      const waitMs = Math.min(capMs, untilNext) || 1000;
      log(`idle; next check in ~${Math.max(1, Math.round(waitMs / 60_000))} min`);
      await sleep(waitMs);
    }
  }
}

main();
