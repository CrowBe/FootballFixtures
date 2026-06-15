import type { LiveGameState } from '@footballfixtures/shared';

class LiveStore {
  /** competitionId → (gameId → LiveGameState) */
  private data = new Map<string, Map<string, LiveGameState>>();

  /** gameIds seen at least once — first sight sets baseline, no event emitted. */
  private seen = new Set<string>();

  private ns(competitionId: string): Map<string, LiveGameState> {
    let m = this.data.get(competitionId);
    if (!m) { m = new Map(); this.data.set(competitionId, m); }
    return m;
  }

  get(competitionId: string, gameId: string): LiveGameState | undefined {
    return this.ns(competitionId).get(gameId);
  }

  getAll(competitionId: string): LiveGameState[] {
    return [...this.ns(competitionId).values()];
  }

  set(competitionId: string, state: LiveGameState): void {
    this.ns(competitionId).set(state.gameId, state);
  }

  delete(competitionId: string, gameId: string): void {
    this.ns(competitionId).delete(gameId);
  }

  /** True if this gameId has been polled at least once in this process lifetime. */
  isSeen(gameId: string): boolean {
    return this.seen.has(gameId);
  }

  markSeen(gameId: string): void {
    this.seen.add(gameId);
  }
}

export const liveStore = new LiveStore();
