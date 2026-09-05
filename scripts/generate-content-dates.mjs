#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = process.cwd();
const DOCS_DIR = path.join(ROOT_DIR, "content", "docs");
const DOCS_PREFIX = "content/docs/";
const OUTPUT_FILE = path.join(
  ROOT_DIR,
  "lib",
  "generated",
  "content-dates.json",
);
const COMMIT_MARKER = ">>";
const CHECK_MODE = process.argv.includes("--check");

/**
 * Parse `git log --format=>>%cI --name-status -M` output (newest commit
 * first) into `Map<repoPath, {published, modified}>` keyed by each file's
 * path at HEAD. `modified` is the newest commit touching the file,
 * `published` the oldest.
 */
export function parseGitLog(log) {
  const dates = new Map();
  // Path as it existed at the current point in history -> HEAD path.
  // Rename entries retarget this while walking backwards, so a file's
  // dates follow it across renames.
  const track = new Map();
  // HEAD paths whose creation commit has been found. Older history under
  // the same name belongs to an unrelated deleted file and must not bleed
  // into this file's dates.
  const sealed = new Set();
  let date = null;

  const resolveKey = (filePath) => {
    const tracked = track.get(filePath);
    if (tracked) return tracked;
    if (sealed.has(filePath)) return null;
    track.set(filePath, filePath);
    return filePath;
  };

  const record = (key, isoDate) => {
    const entry = dates.get(key);
    if (entry) {
      entry.published = isoDate;
    } else {
      dates.set(key, { published: isoDate, modified: isoDate });
    }
  };

  for (const rawLine of log.split("\n")) {
    const line = rawLine.trimEnd();

    if (line.startsWith(COMMIT_MARKER)) {
      date = line.slice(COMMIT_MARKER.length).trim();
      continue;
    }
    if (!line || !date) continue;

    const fields = line.split("\t");
    const kind = fields[0]?.[0];

    if (kind === "R" || kind === "C") {
      const [, oldPath, newPath] = fields;
      if (!oldPath || !newPath) continue;
      const key = resolveKey(newPath);
      if (!key) continue;
      record(key, date);
      track.delete(newPath);
      if (kind === "R") {
        track.set(oldPath, key);
      } else {
        sealed.add(key);
      }
      continue;
    }

    const filePath = fields[1];
    if (!filePath || kind === "D") continue;
    const key = resolveKey(filePath);
    if (!key) continue;
    record(key, date);
    if (kind === "A") {
      sealed.add(key);
      track.delete(filePath);
    }
  }

  return dates;
}

function existingDocPaths() {
  return new Set(
    readdirSync(DOCS_DIR, { recursive: true })
      .map((entry) => String(entry).split(path.sep).join("/"))
      .filter((entry) => entry.endsWith(".mdx")),
  );
}

// The output file is committed: normal builds without usable git history (e.g.
// a shallow or .git-less deploy container) fall back to the committed snapshot
// instead of an empty map. Check mode fails closed because it cannot prove that
// snapshot is current without the full history.
function keepSnapshot(reason) {
  if (CHECK_MODE) {
    console.error(
      `content-dates: cannot verify committed snapshot (${reason}); full git history is required.`,
    );
    process.exitCode = 1;
    return;
  }

  if (existsSync(OUTPUT_FILE)) {
    console.warn(`content-dates: ${reason}; keeping the committed snapshot.`);
    return;
  }

  writeFileSync(OUTPUT_FILE, "{}\n");
  console.warn(
    `content-dates: ${reason} and no committed snapshot exists; wrote an empty map — sitemap falls back to BUILD_TIME.`,
  );
}

function main() {
  mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });

  let log;
  try {
    const shallow =
      execFileSync("git", ["rev-parse", "--is-shallow-repository"], {
        cwd: ROOT_DIR,
        encoding: "utf8",
      }).trim() === "true";

    // A shallow clone truncates history: every file appears created at the
    // clone boundary, so both dates would lie.
    if (shallow) {
      keepSnapshot("shallow clone");
      return;
    }

    log = execFileSync(
      "git",
      [
        "log",
        `--format=${COMMIT_MARKER}%cI`,
        "--name-status",
        "-M",
        "--",
        "content/docs",
      ],
      { cwd: ROOT_DIR, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
    );
  } catch (error) {
    keepSnapshot(`git history unavailable (${error.message ?? error})`);
    return;
  }

  const dates = parseGitLog(log);
  const existing = existingDocPaths();
  const output = {};

  for (const key of [...dates.keys()].sort()) {
    if (!key.startsWith(DOCS_PREFIX)) continue;
    const relativePath = key.slice(DOCS_PREFIX.length);
    if (!existing.has(relativePath)) continue;
    const entry = dates.get(key);
    output[relativePath] = {
      published: entry.published,
      modified: entry.modified,
    };
  }

  const serialized = `${JSON.stringify(output, null, 2)}\n`;
  if (CHECK_MODE) {
    const current = existsSync(OUTPUT_FILE)
      ? readFileSync(OUTPUT_FILE, "utf8")
      : "";
    if (current !== serialized) {
      console.error(
        "content-dates: committed snapshot is stale; run node scripts/generate-content-dates.mjs and commit the result.",
      );
      process.exitCode = 1;
      return;
    }

    console.log(
      `content-dates: committed snapshot matches ${Object.keys(output).length} entries.`,
    );
    return;
  }

  writeFileSync(OUTPUT_FILE, serialized);
  console.log(`content-dates: wrote ${Object.keys(output).length} entries.`);
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
