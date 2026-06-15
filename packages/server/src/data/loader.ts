import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Game } from '@footballfixtures/shared';
import type { Team } from '@footballfixtures/shared';
import { worldCup2026 } from '../competitions/world-cup-2026.js';

interface SeedFile {
  competition: { id: string };
  teams: Team[];
  games: Game[];
}

interface CompetitionData {
  teams: Team[];
  games: Game[];
  loadedAt: number;
}

const cache = new Map<string, CompetitionData>();

/** Absolute path to the repo root (server runs from packages/server). */
const REPO_ROOT = resolve(import.meta.dirname, '..', '..', '..', '..');

export function loadCompetitionData(competitionId: string): CompetitionData {
  const cached = cache.get(competitionId);
  if (cached) return cached;

  const competition = competitionId === worldCup2026.id ? worldCup2026 : null;
  if (!competition) throw new Error(`Unknown competition: ${competitionId}`);

  const filePath = resolve(REPO_ROOT, competition.seedFile);
  const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as SeedFile;

  const data: CompetitionData = {
    teams: raw.teams,
    games: raw.games,
    loadedAt: Date.now(),
  };

  cache.set(competitionId, data);
  return data;
}

/** Reload from disk — called after the poller writes back final scores. */
export function reloadCompetitionData(competitionId: string): CompetitionData {
  cache.delete(competitionId);
  return loadCompetitionData(competitionId);
}

export type { CompetitionData };
