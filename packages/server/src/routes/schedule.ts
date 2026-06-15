import type { Context } from 'hono';
import type { ScheduleResponse } from '@footballfixtures/shared';
import { loadCompetitionData } from '../data/loader.js';
import { computeTtl } from '../lib/ttl.js';
import { makeEtag, setCacheHeaders } from '../lib/etag.js';

const COMPETITION_ID = 'world-cup-2026';

export async function handleSchedule(c: Context): Promise<Response> {
  const { games } = loadCompetitionData(COMPETITION_ID);
  const { ttlSeconds, nextEventAt } = computeTtl(games);

  const body: ScheduleResponse = {
    competitionId: COMPETITION_ID,
    games,
    ttlSeconds,
    nextEventAt,
  };

  const etag = makeEtag(body);

  if (c.req.header('If-None-Match') === etag) {
    return new Response(null, { status: 304 });
  }

  const res = c.json(body);
  setCacheHeaders(res.headers, etag, ttlSeconds);
  return res;
}
