import type { Context } from 'hono';
import type { GameDetailResponse } from '@footballfixtures/shared';
import { loadCompetitionData } from '../data/loader.js';
import { liveStore } from '../live/store.js';
import { computeTtl } from '../lib/ttl.js';
import { makeEtag, setCacheHeaders } from '../lib/etag.js';

const COMPETITION_ID = 'world-cup-2026';

export async function handleGameDetail(c: Context): Promise<Response> {
  const id = c.req.param('id');
  const { games } = loadCompetitionData(COMPETITION_ID);

  const game = games.find((g) => g.id === id);
  if (!game) return c.json({ error: 'Game not found' }, 404);

  const live = liveStore.get(COMPETITION_ID, id);
  const { ttlSeconds, nextEventAt } = computeTtl([game]);

  const body: GameDetailResponse = {
    competitionId: COMPETITION_ID,
    game,
    live,
    ttlSeconds,
    nextEventAt,
  };

  const etag = makeEtag(body);
  if (c.req.header('If-None-Match') === etag) return new Response(null, { status: 304 });

  const res = c.json(body);
  setCacheHeaders(res.headers, etag, ttlSeconds);
  return res;
}
