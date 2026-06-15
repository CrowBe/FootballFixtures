import type { GameEvent, LiveGameState } from '@footballfixtures/shared';
import type { Game } from '@footballfixtures/shared';
import { FINISHED_STATUSES } from '@footballfixtures/shared';

const FINAL_STATUSES = new Set<string>(['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD']);

/**
 * Compare previous and current live state for a game and return any events.
 * Pass isFirstSight=true on the first poll after a cold start — no events are
 * emitted (the fetched state becomes the baseline, avoiding duplicate notifications).
 */
export function detectEvents(
  prev: LiveGameState | undefined,
  next: LiveGameState,
  game: Game,
  isFirstSight: boolean,
): GameEvent[] {
  // First sight after cold start: set baseline, emit nothing.
  if (isFirstSight) return [];

  // No previous state in this process lifetime yet — shouldn't happen, but guard.
  if (!prev) return [];

  const base: Omit<GameEvent, 'type' | 'side'> = {
    gameId: game.id,
    competitionId: game.competitionId,
    homeTeamId: game.homeTeam.id,
    awayTeamId: game.awayTeam.id,
    homeTeamName: game.homeTeam.name,
    awayTeamName: game.awayTeam.name,
    homeScore: next.homeScore,
    awayScore: next.awayScore,
  };

  const events: GameEvent[] = [];

  // Goal detection (check score increase, never decrease — ignore VAR reversals)
  if (next.homeScore > prev.homeScore) {
    events.push({ ...base, type: 'goal', side: 'home' } as GameEvent);
  }
  if (next.awayScore > prev.awayScore) {
    events.push({ ...base, type: 'goal', side: 'away' } as GameEvent);
  }

  // Half-time: live → HT
  if (prev.status !== 'HT' && next.status === 'HT') {
    events.push({ ...base, type: 'half-time' } as GameEvent);
  }

  // Full-time: any live status → a finished status
  if (!FINISHED_STATUSES.has(prev.status) && FINISHED_STATUSES.has(next.status)) {
    events.push({ ...base, type: 'full-time' } as GameEvent);
  }

  return events;
}

export function isFinalStatus(status: string): boolean {
  return FINAL_STATUSES.has(status);
}
