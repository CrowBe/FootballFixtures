export type CompetitionType = 'cup' | 'league';

// ---- Data-source config (one shape per provider) ----------------------------

export interface ApiFootballSourceConfig {
  provider: 'api-football';
  /** API-Football league ID (e.g. 1 for World Cup). */
  league: number;
  /** API-Football season year (e.g. 2026). */
  season: number;
}

/** Union — add new provider shapes here as they're implemented. */
export type CompetitionDataSource = ApiFootballSourceConfig;

// ---- Competition ------------------------------------------------------------

export interface Competition {
  /** Stable kebab-case identifier, used as a namespace in all cache/storage keys. */
  id: string;
  /** Display name (e.g. "World Cup 2026"). */
  name: string;
  type: CompetitionType;
  season: number;
  /** Which upstream provider to use and its identifiers. */
  dataSource: CompetitionDataSource;
  /**
   * Path to the seed/results JSON artifact, relative to the repo root.
   * e.g. "data/competitions/world-cup-2026.json"
   */
  seedFile: string;
}
