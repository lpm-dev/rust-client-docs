import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderOgTemplate } from "../../lib/og";
import { homeOgImage } from "../../lib/shared";

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

/** The size in a JPEG's start-of-frame segment, or null without one. */
function jpegSize(bytes: Buffer) {
  let offset = 2;
  while (offset + 9 < bytes.length && bytes[offset] === 0xff) {
    const marker = bytes[offset + 1];
    const isFrame =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;
    if (isFrame) {
      return {
        height: bytes.readUInt16BE(offset + 5),
        width: bytes.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + bytes.readUInt16BE(offset + 2);
  }
  return null;
}

describe("the home Open Graph card", () => {
  it("is named after its contents, so a new card gets a new URL", async () => {
    const card = await readFile(join(process.cwd(), "public", homeOgImage.url));
    const hash = createHash("sha256").update(card).digest("hex").slice(0, 8);

    expect(homeOgImage.url).toBe(`/og/home.${hash}.jpg`);
  });

  it("declares the type and size of the file it names", async () => {
    const card = await readFile(join(process.cwd(), "public", homeOgImage.url));

    expect(homeOgImage.type).toBe("image/jpeg");
    expect([...card.subarray(0, 3)]).toEqual([0xff, 0xd8, 0xff]);
    expect(jpegSize(card)).toEqual({
      width: homeOgImage.width,
      height: homeOgImage.height,
    });
  });
});

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
