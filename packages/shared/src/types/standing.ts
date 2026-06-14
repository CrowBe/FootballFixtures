export interface StandingEntry {
  position: number;
  team: {
    id: string;
    name: string;
    code: string;
    flag?: string;
  };
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface GroupStanding {
  competitionId: string;
  group: string;
  entries: StandingEntry[];
}
