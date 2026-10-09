import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

const guide = readFileSync("content/docs/infra/tunneling.mdx", "utf8");
const cli = readFileSync("content/docs/infra/tunnel.mdx", "utf8");
const plans = readFileSync("content/docs/lpm-dev-and-pro.mdx", "utf8");
it("publishes paid tunnel availability and independent resource and connection allowances", () => {
  expect(guide).toMatch(/Free.*no.*public tunnels/i);
  expect(guide).toMatch(
    /50,000 HTTP requests, 50 busy hours, 1,000,000 inbound relay messages and 10 GiB/,
  );
  expect(guide).toMatch(/1,000/);
  expect(guide).toMatch(/bundle does not add connection attempts/);
  expect(guide).toMatch(/Public browser WebSockets \| No \| No \| No/);
  expect(cli).toMatch(/Free.*no.*public tunnels/i);
  expect(plans).toMatch(/Public tunnels \| No \|/);
});
it("keeps the published bundle price and spending-cap example consistent", () => {
  const price = Number(guide.match(/Each \$(\d+) bundle/)?.[1]);
  const cap = Number(
    guide.match(/a \$(\d+) cap authorizes at most one extra bundle/)?.[1],
  );
  expect(price).toBe(6);
  expect(Math.floor(cap / price)).toBe(1);
  expect(guide).toMatch(/Extra usage is disabled by default/);
  expect(guide).toMatch(/shared cost shutdown/);
});

it("documents finite response deadlines and bounded partial capture", () => {
  expect(guide).toMatch(
    /50 MiB body limit and a 30-second completion deadline/,
  );
  expect(guide).toMatch(/event stream can continue for up to 30 minutes/);
  expect(guide).toMatch(/up to 1,000 requests or 64 MiB/);
  expect(guide).toMatch(/up to 64 KiB of preview data/);
  expect(guide).toMatch(/queues up to 256 captures and 64 MiB/);
  expect(guide).toMatch(/marks incomplete or truncated captures/);
});
