import { describe, expect, it } from "vitest";
import config from "../../next.config.mjs";

const INSTALLER_URL =
  "https://raw.githubusercontent.com/lpm-dev/rust-client/main/install.sh";

describe("standalone installer redirects", () => {
  it.each([
    "/install",
    "/install.sh",
  ])("serves the current secure installer from %s", async (source) => {
    if (!config.redirects) throw new Error("Next config redirects are missing");
    const redirects = await config.redirects();

    expect(redirects).toContainEqual({
      source,
      destination: INSTALLER_URL,
      permanent: false,
    });
  });
});
