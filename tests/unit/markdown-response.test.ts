import { describe, expect, it } from "vitest";
import { markdownResponse } from "../../lib/markdown-response";

describe("markdownResponse", () => {
  it("serves markdown with noindex and a token estimate", async () => {
    const response = markdownResponse("# Hello agents");

    expect(response.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex");
    expect(response.headers.get("x-markdown-tokens")).toBe(
      String(Math.ceil("# Hello agents".length / 4)),
    );
    expect(await response.text()).toBe("# Hello agents");
  });
});
