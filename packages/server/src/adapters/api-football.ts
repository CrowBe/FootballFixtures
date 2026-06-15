import type { DataAdapter, RawGame, RawLiveGame, RawTeamRef, GameStatus } from '@footballfixtures/shared';
import type { ApiFootballSourceConfig, LiveGameState } from '@footballfixtures/shared';

const API_BASE = 'https://v3.football.api-sports.io';

// ---- Status mapping ---------------------------------------------------------

const STATUS_MAP: Record<string, GameStatus> = {
  TBD: 'NS', NS: 'NS',
  '1H': '1H', HT: 'HT', '2H': '2H',
  ET: 'ET', BT: 'HT',   // BT = break between ET halves → treat as HT
  P: 'P',
  FT: 'FT', AET: 'AET', PEN: 'PEN',
  SUSP: 'SUSP', INT: 'INT', PST: 'PST',
  CANC: 'CANC', ABD: 'ABD', AWD: 'AWD', WO: 'WO',
  LIVE: '1H',            // generic live fallback
};

// ---- Team name normalisation (mirrors tools/enrich/enrich.mjs) --------------

const TEAM_NAME_VARIANTS = new Map([
  ['korea republic', 'south-korea'],
  ['united states', 'usa'],
  ['cote divoire', 'ivory-coast'],
  ['cote d ivoire', 'ivory-coast'],
  ['bosnia and herzegovina', 'bosnia-herzegovina'],
  ['bosnia & herzegovina', 'bosnia-herzegovina'],
  ['dr congo', 'dr-congo'],
  ['congo dr', 'dr-congo'],
  ['democratic republic of congo', 'dr-congo'],
  ['democratic republic of the congo', 'dr-congo'],
  ['cape verde islands', 'cape-verde'],
  ['cabo verde', 'cape-verde'],
  ['curacao', 'curacao'],
  ['netherlands antilles', 'curacao'],
]);

export function normaliseTeamName(name: string): string {
  const key = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return TEAM_NAME_VARIANTS.get(key) ?? key.replace(/\s+/g, '-');
}

// ---- Raw API-Football response shapes (subset we use) -----------------------

interface ApifbFixture {
  fixture: {
    id: number;
    date: string;
    status: { short: string; elapsed: number | null };
  };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  goals: { home: number | null; away: number | null };
}

// ---- Adapter factory ---------------------------------------------------------

export function createApiFootballAdapter(
  config: ApiFootballSourceConfig,
  apiKey: string,
  dailyLimit = 90,
): DataAdapter & { getDailyCallCount: () => number } {
  let dailyCount = 0;
  let dailyDate = '';

  function canCall(): boolean {
    const today = new Date().toISOString().slice(0, 10);
    if (today !== dailyDate) { dailyCount = 0; dailyDate = today; }
    return dailyCount < dailyLimit;
  }

  async function apiFetch(path: string): Promise<ApifbFixture[]> {
    const today = new Date().toISOString().slice(0, 10);
    if (today !== dailyDate) { dailyCount = 0; dailyDate = today; }

    if (!canCall()) {
      console.warn(`[api-football] daily limit ${dailyLimit} reached — skipping call`);
      return [];
    }

    const url = `${API_BASE}${path}`;
    const res = await fetch(url, { headers: { 'x-apisports-key': apiKey } });

    dailyCount++;

    const remaining = res.headers.get('x-ratelimit-requests-remaining');
    if (remaining !== null && Number(remaining) <= 10) {
      console.warn(`[api-football] quota warning: ${remaining} requests remaining today`);
    }

    if (!res.ok) throw new Error(`API-Football ${path} → ${res.status}`);

    const json = (await res.json()) as { response?: ApifbFixture[]; errors?: Record<string, string> };
    if (json.errors && Object.keys(json.errors).length > 0) {
      throw new Error(`API-Football error: ${JSON.stringify(json.errors)}`);
    }
    return json.response ?? [];
  }

  function mapTeam(t: { id: number; name: string }): RawTeamRef {
    return {
      externalId: String(t.id),
      name: t.name,
      code: normaliseTeamName(t.name).slice(0, 3).toUpperCase(),
    };
  }

  function toRawLive(f: ApifbFixture): RawLiveGame {
    return {
      externalId: String(f.fixture.id),
      homeTeam: mapTeam(f.teams.home),
      awayTeam: mapTeam(f.teams.away),
      kickoff: f.fixture.date,
      status: STATUS_MAP[f.fixture.status.short] ?? 'NS',
      homeScore: f.goals.home,
      awayScore: f.goals.away,
      minute: f.fixture.status.elapsed ?? undefined,
    };
  }

  return {
    async fetchSchedule(): Promise<RawGame[]> {
      const fixtures = await apiFetch(
        `/fixtures?league=${config.league}&season=${config.season}`,
      );
      return fixtures.map(toRawLive);
    },

    async fetchLive(): Promise<RawLiveGame[]> {
      const fixtures = await apiFetch(
        `/fixtures?league=${config.league}&season=${config.season}&live=all`,
      );
      return fixtures.map(toRawLive);
    },

    mapStatus(raw: string): GameStatus {
      return STATUS_MAP[raw] ?? 'NS';
    },

    toLiveGameState(raw: RawLiveGame, competitionId: string, internalGameId: string): LiveGameState {
      return {
        gameId: internalGameId,
        competitionId,
        status: raw.status,
        homeScore: raw.homeScore ?? 0,
        awayScore: raw.awayScore ?? 0,
        minute: raw.minute,
        updatedAt: new Date().toISOString(),
      };
    },

    getDailyCallCount() { return dailyCount; },
  };
}
