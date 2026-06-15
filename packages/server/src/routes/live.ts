import type { Context } from 'hono';
import type { LiveResponse } from '@footballfixtures/shared';
import { liveStore } from '../live/store.js';
import { loadCompetitionData } from '../data/loader.js';
import { computeTtl } from '../lib/ttl.js';
import { makeEtag, setCacheHeaders } from '../lib/etag.js';

const COMPETITION_ID = 'world-cup-2026';

export async function handleLive(c: Context): Promise<Response> {
  const { games } = loadCompetitionData(COMPETITION_ID);
  const liveGames = liveStore.getAll(COMPETITION_ID);
  const { ttlSeconds, nextEventAt } = computeTtl(games);

  const body: LiveResponse = {
    competitionId: COMPETITION_ID,
    games: liveGames,
    ttlSeconds,
    nextEventAt,
  };

  const etag = makeEtag(body);
  if (c.req.header('If-None-Match') === etag) return new Response(null, { status: 304 });

  const res = c.json(body);
  setCacheHeaders(res.headers, etag, ttlSeconds);
  return res;
}
