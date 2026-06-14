import type { GameStatus } from '../types/game.js';
import type { LiveGameState } from '../types/live.js';

// ---- Raw shapes returned by provider adapters (before normalisation) --------

export interface RawTeamRef {
  /** Provider-internal ID. */
  externalId: string;
  name: string;
  code: string;
  flag?: string;
}

export interface RawGame {
  /** Provider-internal match ID. */
  externalId: string;
  homeTeam: RawTeamRef;
  awayTeam: RawTeamRef;
  /** ISO 8601 datetime. */
  kickoff: string;
  status: GameStatus;
  homeScore: number | null;
  awayScore: number | null;
  group?: string;
  round?: string;
  venue?: string;
}

export interface RawLiveGame extends RawGame {
  /** Elapsed minutes as reported by the provider. */
  minute?: number;
}

// ---- The adapter interface every provider must implement --------------------

/**
 * One implementation per upstream data provider (currently only 'api-football').
 * Each adapter is stateless; configuration is injected at call sites.
 * Add new providers by implementing this interface and registering them in the
 * adapter registry — no changes to core logic required.
 */
export interface DataAdapter {
  /**
   * Fetch the full schedule for a competition.
   * Used by the seed-diff job and for cold-start rehydration.
   */
  fetchSchedule(): Promise<RawGame[]>;

  /**
   * Fetch current live state for the given provider-internal game IDs.
   * Only called during match windows.
   */
  fetchLive(externalGameIds: string[]): Promise<RawLiveGame[]>;

  /**
   * Translate a provider-specific status string to the canonical GameStatus.
   */
  mapStatus(rawStatus: string): GameStatus;

  /**
   * Map a RawLiveGame to the canonical LiveGameState (handles score normalisation,
   * minute extraction, etc).
   */
  toLiveGameState(raw: RawLiveGame, competitionId: string, internalGameId: string): LiveGameState;
}
