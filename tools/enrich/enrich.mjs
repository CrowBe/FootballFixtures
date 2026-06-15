#!/usr/bin/env node
// FootballFixtures — API-Football enrichment script
// -----------------------------------------------------------------------------
// Fetches the WC 2026 fixture list from API-Football and writes each fixture's
// numeric ID into data/competitions/world-cup-2026.json as:
//   game.providerIds['api-football'] = '<fixtureId>'
//
// Run this once after the season kicks off (or any time fixture IDs are missing).
// Safe to re-run: already-matched games are skipped unless you pass --force.
//
// Requires Node >= 18 (global fetch).
// API key read from API_FOOTBALL_KEY env var (or --env-file on Node >= 20.6).
// -----------------------------------------------------------------------------

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');

const API_KEY = process.env.API_FOOTBALL_KEY ?? '';
const FORCE   = process.argv.includes('--force');
const DRY_RUN = process.argv.includes('--dry-run');

if (!API_KEY) {
  console.error('Missing API_FOOTBALL_KEY. Set it in your environment or pass via --env-file.');
  process.exit(1);
}

const DATA_FILE = resolve(REPO_ROOT, 'data', 'competitions', 'world-cup-2026.json');
const PROVIDER  = 'api-football';

// ---------------------------------------------------------------------------
// Team name normalisation
// ---------------------------------------------------------------------------
// Maps the normalised form of an API-Football team name to our internal team ID.
// Add entries here whenever a new mismatch is discovered.
const TEAM_NAME_MAP = new Map([
  // Variants of South Korea
  ['korea republic', 'south-korea'],
  ['republic of korea', 'south-korea'],
  // Variants of USA
  ['united states', 'usa'],
  ['united states of america', 'usa'],
  // Ivory Coast
  ['cote divoire', 'ivory-coast'],
  ['cote d ivoire', 'ivory-coast'],
  // Bosnia
  ['bosnia and herzegovina', 'bosnia-herzegovina'],
  ['bosnia & herzegovina', 'bosnia-herzegovina'],
  // DR Congo
  ['dr congo', 'dr-congo'],
  ['congo dr', 'dr-congo'],
  ['democratic republic of congo', 'dr-congo'],
  ['democratic republic of the congo', 'dr-congo'],
  // Cape Verde
  ['cape verde islands', 'cape-verde'],
  ['cabo verde', 'cape-verde'],
  // Curaçao (diacritic stripped below, but add common spellings too)
  ['curacao', 'curacao'],
  ['netherlands antilles', 'curacao'],
  // Others that might differ
  ['new zealand', 'new-zealand'],
  ['saudi arabia', 'saudi-arabia'],
  ['south africa', 'south-africa'],
  ['czech republic', 'czech-republic'],
  ['south korea', 'south-korea'],
]);

function normalise(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // strip diacritics
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')          // punctuation → space
    .replace(/\s+/g, ' ')
    .trim();
}

function toTeamId(apiName) {
  const key = normalise(apiName);
  return TEAM_NAME_MAP.get(key) ?? key.replace(/\s+/g, '-');
}

// ---------------------------------------------------------------------------
// API-Football fetch
// ---------------------------------------------------------------------------
async function fetchFixtures(league, season) {
  const url = `https://v3.football.api-sports.io/fixtures?league=${league}&season=${season}`;
  console.log(`Fetching ${url} …`);
  const res = await fetch(url, { headers: { 'x-apisports-key': API_KEY } });
  if (!res.ok) throw new Error(`API-Football responded ${res.status}`);
  const json = await res.json();
  if (json.errors && Object.keys(json.errors).length) {
    throw new Error(`API-Football error: ${JSON.stringify(json.errors)}`);
  }
  return json.response ?? [];
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------
function utcDateStr(isoString) {
  // Returns "YYYY-MM-DD" in UTC from an ISO string like "2026-06-11T19:00:00+00:00"
  return new Date(isoString).toISOString().slice(0, 10);
}

function buildGameIndex(games) {
  // key = "YYYY-MM-DD|homeId|awayId"
  const index = new Map();
  for (const game of games) {
    if (game.homeTeam.id.startsWith('tbd-') || game.awayTeam.id.startsWith('tbd-')) continue;
    const dateKey = utcDateStr(game.kickoff);
    const key = `${dateKey}|${game.homeTeam.id}|${game.awayTeam.id}`;
    index.set(key, game);
  }
  return index;
}

function matchFixture(fixture, gameIndex) {
  const dateKey = utcDateStr(fixture.fixture.date);
  const homeId  = toTeamId(fixture.teams.home.name);
  const awayId  = toTeamId(fixture.teams.away.name);
  const key = `${dateKey}|${homeId}|${awayId}`;
  return { key, homeId, awayId, game: gameIndex.get(key) ?? null };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const seed = JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
  const { dataSource } = seed.competition;

  console.log(`Enriching ${seed.games.length} games for competition "${seed.competition.id}"`);
  console.log(`Provider: ${PROVIDER}  league=${dataSource.league}  season=${dataSource.season}`);
  if (DRY_RUN) console.log('DRY RUN — no files will be written');
  if (FORCE)   console.log('FORCE — re-enriching already-matched games');

  const fixtures = await fetchFixtures(dataSource.league, dataSource.season);
  console.log(`API-Football returned ${fixtures.length} fixtures\n`);

  const gameIndex = buildGameIndex(seed.games);

  let matched = 0;
  let skipped = 0;
  let alreadyEnriched = 0;
  const unmatched = [];

  for (const fixture of fixtures) {
    const { key, homeId, awayId, game } = matchFixture(fixture, gameIndex);

    if (!game) {
      unmatched.push({ fixtureId: fixture.fixture.id, homeId, awayId, date: key.split('|')[0] });
      continue;
    }

    const existingId = game.providerIds?.[PROVIDER];
    if (existingId && !FORCE) {
      alreadyEnriched++;
      continue;
    }

    game.providerIds = { ...game.providerIds, [PROVIDER]: String(fixture.fixture.id) };
    matched++;
  }

  // Summary
  console.log(`Results:`);
  console.log(`  Matched and updated : ${matched}`);
  console.log(`  Already enriched    : ${alreadyEnriched} (skipped; use --force to overwrite)`);
  console.log(`  Unmatched fixtures  : ${unmatched.length}`);

  if (unmatched.length > 0) {
    console.log('\nUnmatched fixtures (review team name mapping or date offset):');
    for (const u of unmatched) {
      console.log(`  [${u.date}] homeId="${u.homeId}" awayId="${u.awayId}"  fixture.id=${u.fixtureId}`);
    }
    console.log('\nTo fix: add the normalised name to TEAM_NAME_MAP in enrich.mjs, then re-run.');
  }

  // Count games that still have no providerIds after this run
  const stillMissing = seed.games.filter(
    (g) => !g.homeTeam.id.startsWith('tbd-') && !g.awayTeam.id.startsWith('tbd-') && !g.providerIds?.[PROVIDER]
  );
  if (stillMissing.length > 0) {
    console.log(`\nGames still missing a ${PROVIDER} ID (${stillMissing.length}):`);
    for (const g of stillMissing) {
      console.log(`  ${g.id}  ${g.homeTeam.name} vs ${g.awayTeam.name}  ${g.kickoff.slice(0, 10)}`);
    }
  }

  if (!DRY_RUN && matched > 0) {
    writeFileSync(DATA_FILE, JSON.stringify(seed, null, 2) + '\n', 'utf-8');
    console.log(`\nWrote ${DATA_FILE}`);
  } else if (DRY_RUN) {
    console.log('\n(Dry run — nothing written)');
  } else {
    console.log('\nNothing to write.');
  }
}

main().catch((err) => {
  console.error('Fatal:', err?.message ?? err);
  process.exit(1);
});
