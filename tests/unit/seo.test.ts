import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/source", () => ({ source: {} }));

import { docsSeoDescription } from "../../lib/seo";

describe("documentation descriptions", () => {
  it("preserves a complete page-specific description without generic padding", () => {
    const page = {
      slugs: ["installation"],
      data: {
        title: "Installation",
        description: "Install LPM CLI via npm, Homebrew, curl, or cargo.",
      },
    };
    expect(
      docsSeoDescription(page as Parameters<typeof docsSeoDescription>[0]),
    ).toBe(page.data.description);
  });
});
