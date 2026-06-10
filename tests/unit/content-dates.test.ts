import { describe, expect, it } from "vitest";
import { parseGitLog } from "../../scripts/generate-content-dates.mjs";

const NEWEST = "2026-06-09T10:00:00+01:00";
const MIDDLE = "2026-05-01T10:00:00+01:00";
const OLDEST = "2026-04-01T10:00:00+01:00";

describe("parseGitLog", () => {
  it("uses the newest commit as modified and the oldest as published", () => {
    const log = [
      `>>${NEWEST}`,
      "M\tcontent/docs/installation.mdx",
      "",
      `>>${MIDDLE}`,
      "M\tcontent/docs/installation.mdx",
      "",
      `>>${OLDEST}`,
      "A\tcontent/docs/installation.mdx",
    ].join("\n");

    expect(parseGitLog(log).get("content/docs/installation.mdx")).toEqual({
      published: OLDEST,
      modified: NEWEST,
    });
  });

  it("follows a file's history across renames", () => {
    const log = [
      `>>${NEWEST}`,
      "R095\tcontent/docs/old-name.mdx\tcontent/docs/new-name.mdx",
      "",
      `>>${OLDEST}`,
      "A\tcontent/docs/old-name.mdx",
    ].join("\n");

    const dates = parseGitLog(log);

    expect(dates.get("content/docs/new-name.mdx")).toEqual({
      published: OLDEST,
      modified: NEWEST,
    });
    expect(dates.has("content/docs/old-name.mdx")).toBe(false);
  });

  it("does not let an older deleted file with the same name bleed into dates", () => {
    const log = [
      `>>${NEWEST}`,
      "A\tcontent/docs/guide.mdx",
      "",
      `>>${MIDDLE}`,
      "D\tcontent/docs/guide.mdx",
      "",
      `>>${OLDEST}`,
      "A\tcontent/docs/guide.mdx",
    ].join("\n");

    expect(parseGitLog(log).get("content/docs/guide.mdx")).toEqual({
      published: NEWEST,
      modified: NEWEST,
    });
  });

  it("treats copies as creations instead of inheriting the source history", () => {
    const log = [
      `>>${NEWEST}`,
      "C090\tcontent/docs/source.mdx\tcontent/docs/copy.mdx",
      "",
      `>>${OLDEST}`,
      "A\tcontent/docs/source.mdx",
      "M\tcontent/docs/copy.mdx",
    ].join("\n");

    const dates = parseGitLog(log);

    expect(dates.get("content/docs/copy.mdx")).toEqual({
      published: NEWEST,
      modified: NEWEST,
    });
    expect(dates.get("content/docs/source.mdx")).toEqual({
      published: OLDEST,
      modified: OLDEST,
    });
  });

  it("tracks several files independently within one commit", () => {
    const log = [
      `>>${NEWEST}`,
      "M\tcontent/docs/a.mdx",
      "A\tcontent/docs/b.mdx",
      "",
      `>>${OLDEST}`,
      "A\tcontent/docs/a.mdx",
    ].join("\n");

    const dates = parseGitLog(log);

    expect(dates.get("content/docs/a.mdx")).toEqual({
      published: OLDEST,
      modified: NEWEST,
    });
    expect(dates.get("content/docs/b.mdx")).toEqual({
      published: NEWEST,
      modified: NEWEST,
    });
  });
});
