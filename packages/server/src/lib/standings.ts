import type { Game, GroupStanding, StandingEntry } from '@footballfixtures/shared';
import { FINISHED_STATUSES } from '@footballfixtures/shared';

interface TeamStats {
  id: string;
  name: string;
  code: string;
  flag?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
}

function emptyStats(id: string, name: string, code: string, flag?: string): TeamStats {
  return {
    id,
    name,
    code,
    ...(flag !== undefined ? { flag } : {}),
    played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0,
  };
}

export function computeStandings(competitionId: string, games: Game[]): GroupStanding[] {
  const groupMap = new Map<string, Map<string, TeamStats>>();

  for (const game of games) {
    if (!game.group) continue;
    if (!FINISHED_STATUSES.has(game.status)) continue;
    if (game.homeScore === null || game.awayScore === null) continue;

    if (!groupMap.has(game.group)) groupMap.set(game.group, new Map());
    const group = groupMap.get(game.group)!;

    const { homeTeam, awayTeam, homeScore, awayScore } = game;

    if (!group.has(homeTeam.id)) {
      group.set(homeTeam.id, emptyStats(homeTeam.id, homeTeam.name, homeTeam.code, homeTeam.flag));
    }
    if (!group.has(awayTeam.id)) {
      group.set(awayTeam.id, emptyStats(awayTeam.id, awayTeam.name, awayTeam.code, awayTeam.flag));
    }

    const home = group.get(homeTeam.id)!;
    const away = group.get(awayTeam.id)!;

    home.played++;
    away.played++;
    home.goalsFor += homeScore;
    home.goalsAgainst += awayScore;
    away.goalsFor += awayScore;
    away.goalsAgainst += homeScore;

    if (homeScore > awayScore) {
      home.won++;
      away.lost++;
    } else if (homeScore === awayScore) {
      home.drawn++;
      away.drawn++;
    } else {
      away.won++;
      home.lost++;
    }
  }

  const standings: GroupStanding[] = [];

  for (const [group, teamMap] of [...groupMap.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const entries: StandingEntry[] = [...teamMap.values()]
      .map((s): StandingEntry => ({
        position: 0,
        team: { id: s.id, name: s.name, code: s.code, ...(s.flag !== undefined ? { flag: s.flag } : {}) },
        played: s.played,
        won: s.won,
        drawn: s.drawn,
        lost: s.lost,
        goalsFor: s.goalsFor,
        goalsAgainst: s.goalsAgainst,
        goalDifference: s.goalsFor - s.goalsAgainst,
        points: s.won * 3 + s.drawn,
      }))
      .sort((a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        a.team.name.localeCompare(b.team.name),
      )
      .map((e, i) => ({ ...e, position: i + 1 }));

    standings.push({ competitionId, group, entries });
  }

  return standings;
}
