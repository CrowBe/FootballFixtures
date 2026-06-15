/**
 * In-memory push token registry.
 * v1: lost on Render restart. Devices re-register on next foreground.
 * Future: back by Redis or similar.
 */
class PushRegistry {
  /** pushToken → set of teamIds the device follows */
  private tokenTeams = new Map<string, Set<string>>();
  /** teamId → set of pushTokens subscribed */
  private teamTokens = new Map<string, Set<string>>();

  register(pushToken: string, teamIds: string[]): void {
    // Remove stale team subscriptions for this token
    const old = this.tokenTeams.get(pushToken);
    if (old) {
      for (const tid of old) this.teamTokens.get(tid)?.delete(pushToken);
    }

    const teamSet = new Set(teamIds);
    this.tokenTeams.set(pushToken, teamSet);

    for (const tid of teamIds) {
      let tokens = this.teamTokens.get(tid);
      if (!tokens) { tokens = new Set(); this.teamTokens.set(tid, tokens); }
      tokens.add(pushToken);
    }
  }

  getTokensForTeams(teamIds: string[]): string[] {
    const result = new Set<string>();
    for (const tid of teamIds) {
      const tokens = this.teamTokens.get(tid);
      if (tokens) for (const t of tokens) result.add(t);
    }
    return [...result];
  }

  size(): number { return this.tokenTeams.size; }
}

export const pushRegistry = new PushRegistry();
