import fs from "node:fs";
import path from "node:path";
import { SYMBOL_MAP, type Category } from "./symbols";
import { commitFiles, fetchJsonFile, isGithubCommitConfigured } from "./githubRepo";

// Once-a-day cron (Vercel Hobby's cron limit), so 120 points is ~4 months
// of history per symbol before the oldest point rolls off.
const MAX_POINTS = 120;

export interface HistoryPoint {
  t: number;
  p: number;
}

type FileMap = Record<string, HistoryPoint[]>;

const FILENAMES: Record<Category, string> = {
  currency: "DatabaseCurrency.json",
  gold: "DatabaseGold.json",
  crypto: "DatabaseCrypto.json",
  energy: "DatabaseEnergy.json",
  purity: "DatabaseGoldPurity.json",
};

const ALL_CATEGORIES: Category[] = ["currency", "gold", "crypto", "energy", "purity"];

// GitHub API calls need the full repo-relative path.
const FILES: Record<Category, string> = Object.fromEntries(
  ALL_CATEGORIES.map((c) => [c, `data/${FILENAMES[c]}`])
) as Record<Category, string>;

// The literal "data" segment (rather than a fully dynamic path) keeps
// Next's build tracer scoped to just that folder instead of the whole
// project — see the "Dynamic filesystem access" build warning otherwise.
function readBundledFile(category: Category): FileMap {
  try {
    const abs = path.join(process.cwd(), "data", FILENAMES[category]);
    return JSON.parse(fs.readFileSync(abs, "utf8"));
  } catch {
    return {};
  }
}

/**
 * Reads straight from the deployed bundle (the JSON files are committed to
 * the repo, so they're just part of the build) — correct for serving
 * requests, since it always matches what's actually live.
 */
export function getHistory(symbol: string, sinceMs: number): HistoryPoint[] {
  const meta = SYMBOL_MAP[symbol];
  if (!meta) return [];
  const data = readBundledFile(meta.category);
  return (data[symbol] ?? []).filter((p) => p.t >= sinceMs);
}

export function isHistoryWriteConfigured(): boolean {
  return isGithubCommitConfigured();
}

/**
 * Appends today's snapshot to each category file and commits all three in
 * one atomic commit, which triggers Vercel's normal git-push auto-deploy.
 * Merges against GitHub's current HEAD (not the local bundle) so this is
 * safe even if something else touched the files since the last deploy.
 */
export async function recordSnapshot(items: Array<{ symbol: string; price: number }>): Promise<boolean> {
  if (!isGithubCommitConfigured()) return false;

  const now = Date.now();
  const categories = ALL_CATEGORIES;
  const current = await Promise.all(categories.map((c) => fetchJsonFile<FileMap>(FILES[c], {})));
  const byCategory = Object.fromEntries(categories.map((c, i) => [c, current[i]])) as Record<Category, FileMap>;

  for (const { symbol, price } of items) {
    const meta = SYMBOL_MAP[symbol];
    if (!meta) continue;
    const store = byCategory[meta.category];
    const arr = store[symbol] ?? [];
    arr.push({ t: now, p: price });
    store[symbol] = arr.slice(-MAX_POINTS);
  }

  const dateLabel = new Date(now).toISOString().slice(0, 10);
  return commitFiles(
    categories.map((c) => ({ path: FILES[c], content: byCategory[c] })),
    `chore: daily price snapshot (${dateLabel})`
  );
}
