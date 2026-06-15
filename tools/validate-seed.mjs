#!/usr/bin/env node
// Validates competition seed JSON files.
// Usage: node tools/validate-seed.mjs [path/to/file.json ...]
// With no args, validates all files under data/competitions/.

import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const VALID_STATUSES = new Set([
  'NS', '1H', 'HT', '2H', 'ET', 'P', 'FT', 'AET', 'PEN',
  'SUSP', 'INT', 'PST', 'CANC', 'ABD', 'AWD', 'WO',
]);

const REPO_ROOT = resolve(import.meta.dirname, '..');
const DATA_DIR = join(REPO_ROOT, 'data', 'competitions');

function getFiles() {
  const args = process.argv.slice(2);
  if (args.length > 0) return args.map((a) => resolve(a));
  return readdirSync(DATA_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => join(DATA_DIR, f));
}

function validateTeam(team, path) {
  const errors = [];
  if (typeof team?.id !== 'string' || !team.id) errors.push(`${path}.id missing`);
  if (typeof team?.name !== 'string' || !team.name) errors.push(`${path}.name missing`);
  if (typeof team?.code !== 'string' || team.code.length !== 3) errors.push(`${path}.code must be 3 chars`);
  return errors;
}

function validateFile(filePath) {
  let root;
  try {
    root = JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch (e) {
    return [`[${filePath}] Invalid JSON: ${e.message}`];
  }

  const errors = [];

  if (!Array.isArray(root.games)) {
    return [`[${filePath}] root.games must be an array`];
  }

  const seenIds = new Set();

  for (let i = 0; i < root.games.length; i++) {
    const g = root.games[i];
    const p = `games[${i}]`;

    if (typeof g.id !== 'string' || !g.id) {
      errors.push(`${p}.id missing`);
    } else if (seenIds.has(g.id)) {
      errors.push(`${p}.id "${g.id}" is a duplicate`);
    } else {
      seenIds.add(g.id);
    }

    errors.push(...validateTeam(g.homeTeam, `${p}.homeTeam`));
    errors.push(...validateTeam(g.awayTeam, `${p}.awayTeam`));

    if (typeof g.kickoff !== 'string' || isNaN(Date.parse(g.kickoff))) {
      errors.push(`${p}.kickoff must be a valid ISO date string`);
    }

    if (!VALID_STATUSES.has(g.status)) {
      errors.push(`${p}.status "${g.status}" is not a recognised GameStatus`);
    }

    if (g.finished !== true && g.finished !== false) {
      errors.push(`${p}.finished must be boolean`);
    }

    if (g.finished && (g.homeScore == null || g.awayScore == null)) {
      errors.push(`${p} is finished but homeScore/awayScore are missing`);
    }
  }

  return errors.map((e) => `[${filePath}] ${e}`);
}

const files = getFiles();
let totalErrors = 0;

for (const file of files) {
  const errs = validateFile(file);
  if (errs.length === 0) {
    console.log(`✓ ${file} — OK (no issues)`);
  } else {
    errs.forEach((e) => console.error(`✗ ${e}`));
    totalErrors += errs.length;
  }
}

if (totalErrors > 0) {
  console.error(`\n${totalErrors} error(s) found.`);
  process.exit(1);
} else {
  console.log(`\nAll ${files.length} file(s) valid.`);
}
