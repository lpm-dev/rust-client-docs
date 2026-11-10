import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TOC_COLUMN_CLASS, TocColumn } from "@/components/toc-column";

const FUMADOCS_TOC = join(
  process.cwd(),
  "node_modules/fumadocs-ui/dist/layouts/docs/page/slots/toc.js",
);

describe("TocColumn", () => {
  it("reserves the column width Fumadocs' table of contents sets", () => {
    const toc = readFileSync(FUMADOCS_TOC, "utf8");

    // Both the table of contents and its empty placeholder set the width.
    expect(toc.split(TOC_COLUMN_CLASS).length - 1).toBe(2);
  });

  it("renders an empty hidden marker", () => {
    expect(renderToStaticMarkup(<TocColumn />)).toBe(
      `<span hidden="" class="${TOC_COLUMN_CLASS}"></span>`,
    );
  });

  it("opens every docs page that has a table of contents", () => {
    const page = readFileSync(
      join(process.cwd(), "app/docs/[[...slug]]/page.tsx"),
      "utf8",
    );

    expect(page).toMatch(
      /<DocsPage toc=\{page\.data\.toc\} full=\{page\.data\.full\}>\s*\{!page\.data\.full && <TocColumn \/>\}/,
    );
  });
});
