import { PHASE_PRODUCTION_SERVER } from "next/constants.js";
import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config.mjs";

const config = await nextConfig(PHASE_PRODUCTION_SERVER, {
  defaultConfig: {},
});

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
