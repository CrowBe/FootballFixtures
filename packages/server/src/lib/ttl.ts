import type { Game } from '@footballfixtures/shared';
import { LIVE_STATUSES } from '@footballfixtures/shared';

const TTL_LIVE_S = 25;           // during a match
const TTL_PRE_KICKOFF_S = 120;   // within 30 min of kickoff
const TTL_PRE_WINDOW_S = 120;    // within 30 min before a window opens
const TTL_MAX_S = 3600;          // max idle TTL (1 hour)
const PRE_KICKOFF_WINDOW_MS = 30 * 60 * 1000;

export interface TtlResult {
  ttlSeconds: number;
  nextEventAt: string | null;
}

export function computeTtl(games: Game[], nowMs = Date.now()): TtlResult {
  const hasLiveGame = games.some((g) => LIVE_STATUSES.has(g.status));
  if (hasLiveGame) {
    return { ttlSeconds: TTL_LIVE_S, nextEventAt: null };
  }

  // Find the next unfinished kickoff
  let nextKickoffMs: number | null = null;
  for (const g of games) {
    if (g.finished) continue;
    const ko = Date.parse(g.kickoff);
    if (!Number.isFinite(ko) || ko <= nowMs) continue;
    if (nextKickoffMs === null || ko < nextKickoffMs) nextKickoffMs = ko;
  }

  if (nextKickoffMs === null) {
    // Tournament over / no scheduled games — long TTL
    return { ttlSeconds: TTL_MAX_S, nextEventAt: null };
  }

  const msUntilKickoff = nextKickoffMs - nowMs;

  if (msUntilKickoff <= PRE_KICKOFF_WINDOW_MS) {
    return {
      ttlSeconds: TTL_PRE_KICKOFF_S,
      nextEventAt: new Date(nextKickoffMs).toISOString(),
    };
  }

  // Wake up 30 min before the next kickoff so the cache is fresh
  const wakeAt = nextKickoffMs - PRE_KICKOFF_WINDOW_MS;
  const secondsUntilWake = Math.ceil((wakeAt - nowMs) / 1000);
  const ttl = Math.min(TTL_MAX_S, Math.max(TTL_PRE_WINDOW_S, secondsUntilWake));

  return {
    ttlSeconds: ttl,
    nextEventAt: new Date(nextKickoffMs).toISOString(),
  };
}
