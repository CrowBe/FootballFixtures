export type GameStatus =
  | 'NS'    // Not started
  | '1H'    // First half in play
  | 'HT'    // Half-time
  | '2H'    // Second half in play
  | 'ET'    // Extra time
  | 'P'     // Penalties in progress
  | 'FT'    // Full-time (90 min)
  | 'AET'   // Full-time after extra time
  | 'PEN'   // Full-time after penalties
  | 'SUSP'  // Suspended
  | 'INT'   // Interrupted
  | 'PST'   // Postponed
  | 'CANC'  // Cancelled
  | 'ABD'   // Abandoned
  | 'AWD'   // Technical loss
  | 'WO';   // Walk-over

export const LIVE_STATUSES: ReadonlySet<GameStatus> = new Set(['1H', 'HT', '2H', 'ET', 'P']);
export const FINISHED_STATUSES: ReadonlySet<GameStatus> = new Set(['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD']);

export interface GameTeamRef {
  id: string;
  name: string;
  /** 3-letter code, e.g. "BRA". */
  code: string;
  /** Emoji flag or undefined. */
  flag?: string;
}

export interface Game {
  id: string;
  competitionId: string;
  homeTeam: GameTeamRef;
  awayTeam: GameTeamRef;
  /** ISO 8601 datetime string. Always rendered in the user's local timezone. */
  kickoff: string;
  status: GameStatus;
  homeScore: number | null;
  awayScore: number | null;
  /** e.g. "Group A" — undefined for knockout rounds. */
  group?: string;
  /** e.g. "Group Stage", "Round of 32", "Quarter-final". */
  round?: string;
  venue?: string;
  finished: boolean;
}
