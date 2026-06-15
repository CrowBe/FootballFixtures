import type { Context } from 'hono';
import type { PollResponse, FinalizedGame, Game } from '@footballfixtures/shared';
import { LIVE_STATUSES } from '@footballfixtures/shared';
import { loadCompetitionData } from '../data/loader.js';
import { liveStore } from '../live/store.js';
import { detectEvents, isFinalStatus } from '../live/diff.js';
import { fanOut } from '../push/notify.js';
import { createApiFootballAdapter } from '../adapters/api-football.js';
import { normaliseTeamName } from '../adapters/api-football.js';
import { worldCup2026 } from '../competitions/world-cup-2026.js';

const COMPETITION_ID = 'world-cup-2026';
const POLL_SECRET = process.env['POLL_SECRET'] ?? '';
const API_KEY = process.env['API_FOOTBALL_KEY'] ?? '';
const DAILY_LIMIT = Number(process.env['API_FOOTBALL_DAILY_LIMIT'] ?? 90);

const adapter = API_KEY
  ? createApiFootballAdapter(worldCup2026.dataSource, API_KEY, DAILY_LIMIT)
  : null;

// ---- Window helpers ---------------------------------------------------------

const LEAD_MS = 5 * 60_000;
const TAIL_MS = 130 * 60_000;

function gamesInWindow(games: Game[], nowMs = Date.now()): Game[] {
  return games.filter((g) => {
    if (g.finished) return false;
    const ko = Date.parse(g.kickoff);
    if (!Number.isFinite(ko)) return false;
    return nowMs >= ko - LEAD_MS && nowMs <= ko + TAIL_MS;
  });
}

// ---- Build lookup index: API-Football fixture ID → our Game -----------------

function buildFixtureIndex(games: Game[]): {
  byFixtureId: Map<string, Game>;
  byNameDate: Map<string, Game>;
} {
  const byFixtureId = new Map<string, Game>();
  const byNameDate = new Map<string, Game>();

  for (const game of games) {
    const fid = game.providerIds?.['api-football'];
    if (fid) byFixtureId.set(fid, game);

    // Fallback: normalised date|homeId|awayId
    if (!game.homeTeam.id.startsWith('tbd-') && !game.awayTeam.id.startsWith('tbd-')) {
      const dateKey = new Date(game.kickoff).toISOString().slice(0, 10);
      byNameDate.set(`${dateKey}|${game.homeTeam.id}|${game.awayTeam.id}`, game);
    }
  }

  return { byFixtureId, byNameDate };
}

// ---- Handler ----------------------------------------------------------------

export async function handlePoll(c: Context): Promise<Response> {
  // Auth check
  const auth = c.req.header('Authorization');
  if (!POLL_SECRET || auth !== `Bearer ${POLL_SECRET}`) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { games } = loadCompetitionData(COMPETITION_ID);
  const candidates = gamesInWindow(games);

  if (candidates.length === 0) {
    return c.json({
      ok: true, gamesChecked: 0, eventsEmitted: 0, finalizedGames: [],
    } satisfies PollResponse);
  }

  if (!adapter) {
    console.warn('[poll] API_FOOTBALL_KEY not set — returning no-op');
    return c.json({
      ok: true, gamesChecked: candidates.length, eventsEmitted: 0, finalizedGames: [],
    } satisfies PollResponse);
  }

  // Fetch live state from API-Football (one call covers all live games)
  let rawLive;
  try {
    rawLive = await adapter.fetchLive([]);
  } catch (err) {
    console.error('[poll] fetchLive failed:', (err as Error).message);
    return c.json({ error: 'upstream fetch failed' }, 502);
  }

  if (rawLive.length === 0 && candidates.some((g) => LIVE_STATUSES.has(g.status))) {
    // API returned nothing live but we expected some — may be a window edge case; continue
  }

  const { byFixtureId, byNameDate } = buildFixtureIndex(candidates);

  let eventsEmitted = 0;
  const finalizedGames: FinalizedGame[] = [];

  for (const raw of rawLive) {
    // Find our internal game record (fixture ID first, then name+date fallback)
    let game = byFixtureId.get(raw.externalId);
    if (!game) {
      const dateKey = new Date(raw.kickoff).toISOString().slice(0, 10);
      const homeId = normaliseTeamName(raw.homeTeam.name);
      const awayId = normaliseTeamName(raw.awayTeam.name);
      game = byNameDate.get(`${dateKey}|${homeId}|${awayId}`);
    }
    if (!game) continue; // not one of our candidate games

    const isFirstSight = !liveStore.isSeen(game.id);
    const prev = liveStore.get(COMPETITION_ID, game.id);
    const next = adapter.toLiveGameState(raw, COMPETITION_ID, game.id);

    // Update store and mark seen before detecting events
    liveStore.set(COMPETITION_ID, next);
    liveStore.markSeen(game.id);

    const events = detectEvents(prev, next, game, isFirstSight);

    for (const event of events) {
      try {
        await fanOut(event);
      } catch (e) {
        console.error('[poll] fanOut error:', (e as Error).message);
      }
      eventsEmitted++;

      if (event.type === 'full-time') {
        const ftStatus = next.status === 'AET' ? 'AET' : next.status === 'PEN' ? 'PEN' : 'FT';
        finalizedGames.push({
          id: game.id,
          competitionId: COMPETITION_ID,
          homeScore: next.homeScore,
          awayScore: next.awayScore,
          status: ftStatus as FinalizedGame['status'],
        });
        // Remove from live store — it's done
        liveStore.delete(COMPETITION_ID, game.id);
      }
    }
  }

  console.log(
    `[poll] candidates=${candidates.length} live=${rawLive.length}` +
    ` events=${eventsEmitted} finalized=${finalizedGames.length}` +
    ` api-calls-today=${adapter.getDailyCallCount()}`,
  );

  return c.json({
    ok: true,
    gamesChecked: candidates.length,
    eventsEmitted,
    finalizedGames,
  } satisfies PollResponse);
}
