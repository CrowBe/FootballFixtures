import type { Competition } from '@footballfixtures/shared';

/**
 * World Cup 2026 — the first configured competition.
 * All identifiers (API-Football league/season) live here, not hardcoded
 * anywhere in core logic.
 */
export const worldCup2026: Competition = {
  id: 'world-cup-2026',
  name: 'World Cup 2026',
  type: 'cup',
  season: 2026,
  dataSource: {
    provider: 'api-football',
    league: 1,
    season: 2026,
  },
  seedFile: 'data/competitions/world-cup-2026.json',
};
