import type { Context } from 'hono';
import type { StandingsResponse } from '@footballfixtures/shared';
import { loadCompetitionData } from '../data/loader.js';
import { computeTtl } from '../lib/ttl.js';
import { makeEtag, setCacheHeaders } from '../lib/etag.js';
import { computeStandings } from '../lib/standings.js';

const COMPETITION_ID = 'world-cup-2026';

export async function handleStandings(c: Context): Promise<Response> {
  const { games } = loadCompetitionData(COMPETITION_ID);
  const { ttlSeconds, nextEventAt } = computeTtl(games);

  const standings = computeStandings(COMPETITION_ID, games);

  const body: StandingsResponse = {
    competitionId: COMPETITION_ID,
    standings,
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
