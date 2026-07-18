import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderOgTemplate } from "../../lib/og";

const FONT_ASSETS = [
  {
    path: "public/fonts/inter-og-regular.ttf",
    bytes: 337936,
    sha256: "aff10562c603409a49b7ef6591467cb02fc5f6f412ecde10a3f3dcd8f0d6fa52",
  },
  {
    path: "public/fonts/inter-og-bold.ttf",
    bytes: 339200,
    sha256: "95125c934078475c386060a78206961655e9b20a5b79557b97b7c4b728eb9207",
  },
] as const;

describe("Open Graph assets", () => {
  it("keeps the local font payloads pinned", async () => {
    for (const asset of FONT_ASSETS) {
      const data = await readFile(join(process.cwd(), asset.path));
      expect(data.byteLength).toBe(asset.bytes);
      expect(createHash("sha256").update(data).digest("hex")).toBe(
        asset.sha256,
      );
    }
  });

  it("loads both local Inter weights into the template", async () => {
    const { options } = await renderOgTemplate({ title: "LPM CLI" });

    expect(options.fonts).toHaveLength(2);
    expect(options.fonts.map(({ name, weight }) => ({ name, weight }))).toEqual(
      [
        { name: "Inter", weight: 400 },
        { name: "Inter", weight: 700 },
      ],
    );
    for (const font of options.fonts) {
      expect(font.data.byteLength).toBeGreaterThan(0);
    }
  });
});
