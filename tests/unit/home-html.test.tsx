import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TypedHero } from "../../app/(home)/_components/typed-hero";
import { FEATURES, GUARDRAILS, HERO_SUB, MORE } from "../../lib/home-content";

describe("server-rendered homepage content", () => {
  it("renders a complete H1 without JavaScript", () => {
    const html = renderToStaticMarkup(<TypedHero />);

    expect(html).toMatch(/^<h1[\s\S]*<\/h1>$/);
    expect(html).toContain("The fast,");
    expect(html).toContain("all-in-one toolkit");
    expect(html).toContain("for modern software.");
    expect(html).toContain('class="hero-static"');
  });

  it("keeps more than 500 characters of homepage copy in server data", () => {
    const text = [
      HERO_SUB,
      ...[...FEATURES, ...MORE, ...GUARDRAILS].flatMap((item) => [
        item.title,
        item.body,
        item.cmd,
      ]),
    ].join(" ");

    expect(text.length).toBeGreaterThan(500);
  });
});
