import assert from "node:assert/strict";

const origin = (
  process.env.AGENT_READINESS_ORIGIN || "http://127.0.0.1:3000"
).replace(/\/$/, "");

async function request(path, init) {
  return fetch(`${origin}${path}`, { redirect: "manual", ...init });
}

function readableText(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const home = await request("/");
assert.equal(home.status, 200);
const homeHtml = await home.text();
assert.match(
  homeHtml,
  /<h1\b[\s\S]*?hero-static[\s\S]*?The fast,[\s\S]*?<\/h1>/,
);
assert.ok(
  readableText(homeHtml).length > 500,
  "Homepage has 500+ text characters",
);

const html404 = await request("/agent-readiness-path-that-does-not-exist");
assert.equal(html404.status, 404);
const html404Body = await html404.text();
for (const path of ["/sitemap.xml", "/llms.txt", "/openapi.json"]) {
  assert.ok(html404Body.includes(path), `HTML 404 links ${path}`);
}

for (const path of [
  "/agent-readiness-path-that-does-not-exist",
  "/docs/agent-readiness-page-that-does-not-exist",
]) {
  const markdown404 = await request(path, {
    headers: { Accept: "text/markdown" },
  });
  assert.equal(markdown404.status, 404);
  assert.match(markdown404.headers.get("content-type") || "", /text\/markdown/);
  const body = await markdown404.text();
  assert.match(body, /^# 404: LPM CLI resource not found/);
  assert.ok(
    body.includes(
      `${origin.replace("127.0.0.1:3000", "cli.lpm.dev")}/llms.txt`,
    ) || body.includes("https://cli.lpm.dev/llms.txt"),
  );
}

const openApi = await request("/openapi.json");
assert.equal(openApi.status, 200);
const openApiBody = await openApi.json();
assert.equal(openApiBody.openapi, "3.1.1");
assert.ok(openApiBody.info.title.includes("LPM CLI"));
assert.ok(openApiBody.paths["/api/search"]);

const api404 = await request("/api/agent-readiness-route-that-does-not-exist");
assert.equal(api404.status, 404);
assert.match(
  api404.headers.get("content-type") || "",
  /application\/problem\+json/,
);
const api404Body = await api404.json();
assert.equal(api404Body.code, "API_ROUTE_NOT_FOUND");
assert.equal(typeof api404Body.message, "string");
assert.equal(typeof api404Body.resolution, "string");

const apiRoot = await request("/api");
assert.equal(apiRoot.status, 404);
assert.match(
  apiRoot.headers.get("content-type") || "",
  /application\/problem\+json/,
);

const search = await request("/api/search?query=install&limit=1");
assert.equal(search.status, 200);
assert.ok(Array.isArray(await search.json()));

const searchMethod = await request("/api/search", { method: "POST" });
assert.equal(searchMethod.status, 405);
assert.equal((await searchMethod.json()).code, "METHOD_NOT_ALLOWED");

const cron = await request("/api/cron/indexnow-sync");
assert.equal(cron.status, 401);
assert.equal((await cron.json()).code, "AUTH_REQUIRED");

const llms = await request("/llms.txt");
assert.equal(llms.status, 200);
const llmsBody = await llms.text();
assert.match(llmsBody, /^# LPM CLI developer resources\n\n>/);
assert.equal(llmsBody.match(/^# /gm)?.length, 1);
assert.ok(llmsBody.includes("https://cli.lpm.dev/openapi.json"));

const catalog = await request("/.well-known/api-catalog");
assert.equal(catalog.status, 200);
assert.match(
  catalog.headers.get("content-type") || "",
  /application\/linkset\+json/,
);
assert.match(catalog.headers.get("link") || "", /rel="service-desc"/);
const catalogBody = await catalog.json();
assert.equal(
  catalogBody.linkset[0].item[0].href,
  "https://cli.lpm.dev/api/search",
);

const catalogHead = await request("/.well-known/api-catalog", {
  method: "HEAD",
});
assert.equal(catalogHead.status, 200);
assert.match(catalogHead.headers.get("link") || "", /rel="item"/);

const developerResources = await request("/docs/developer-resources");
assert.equal(developerResources.status, 200);
assert.ok(
  (await developerResources.text()).includes("LPM CLI developer resources"),
);

console.log(`Agent-readiness integration checks passed for ${origin}`);
