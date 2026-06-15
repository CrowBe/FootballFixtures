import type { Game } from './game.js';
import type { GroupStanding } from './standing.js';
import type { LiveGameState } from './live.js';

// ---- Shared response envelope fields ----------------------------------------

interface FreshnessHints {
  /**
   * Client should treat this response as fresh for this many seconds.
   * Use as refetchInterval AND staleTime in TanStack Query.
   * Relative (no client-clock dependency).
   */
  ttlSeconds: number;
  /**
   * ISO 8601 datetime of the next known event (kickoff, bracket resolution, etc.)
   * so an idle client can wake at exactly the right time. null if unknown.
   */
  nextEventAt: string | null;
}

// ---- GET /schedule ----------------------------------------------------------

export interface ScheduleResponse extends FreshnessHints {
  competitionId: string;
  games: Game[];
}

// ---- GET /standings ---------------------------------------------------------

export interface StandingsResponse extends FreshnessHints {
  competitionId: string;
  standings: GroupStanding[];
}

// ---- GET /live --------------------------------------------------------------

export interface LiveResponse extends FreshnessHints {
  competitionId: string;
  games: LiveGameState[];
}

// ---- GET /games/:id ---------------------------------------------------------

export interface GameDetailResponse extends FreshnessHints {
  competitionId: string;
  game: Game;
  /** Present when the game is live. */
  live?: LiveGameState;
}

// ---- POST /register ---------------------------------------------------------

export interface RegisterRequest {
  /** Expo push token from getExpoPushTokenAsync. */
  pushToken: string;
  /** IDs of teams the user follows ("My team"). */
  teamIds: string[];
  competitionId: string;
}

export interface RegisterResponse {
  ok: boolean;
}

// ---- POST /poll (protected — server-to-server) ------------------------------

/** A game that reached FT/AET/PEN in this poll cycle. Used by the poller to write back final scores. */
export interface FinalizedGame {
  id: string;
  competitionId: string;
  homeScore: number;
  awayScore: number;
  status: 'FT' | 'AET' | 'PEN';
}

export interface PollResponse {
  ok: boolean;
  gamesChecked: number;
  eventsEmitted: number;
  /** Games that reached a final status in this cycle — poller writes these back to the seed JSON. */
  finalizedGames: FinalizedGame[];
}
