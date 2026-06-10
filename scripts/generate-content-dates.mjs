#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
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

function main() {
  mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });

  let log;
  let shallow;
  try {
    shallow =
      execFileSync("git", ["rev-parse", "--is-shallow-repository"], {
        cwd: ROOT_DIR,
        encoding: "utf8",
      }).trim() === "true";
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
    writeFileSync(OUTPUT_FILE, "{}\n");
    console.warn(
      `content-dates: git history unavailable (${error.message ?? error}); wrote empty map — sitemap falls back to BUILD_TIME.`,
    );
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
    // A shallow clone truncates history: the oldest visible commit is the
    // clone boundary, not the real creation commit, so publish dates lie.
    output[relativePath] = shallow
      ? { modified: entry.modified }
      : { published: entry.published, modified: entry.modified };
  }

  writeFileSync(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`);
  console.log(
    `content-dates: wrote ${Object.keys(output).length} entries${
      shallow ? " (shallow clone — publish dates omitted)" : ""
    }.`,
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
