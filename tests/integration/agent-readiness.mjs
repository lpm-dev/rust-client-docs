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
const homeH1 = homeHtml.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/)?.[0];
assert.ok(homeH1, "Homepage has an H1");
assert.ok(readableText(homeH1).includes("The fast, all-in-one toolkit"));
assert.ok(
  !homeH1.includes("hero-typed"),
  "Server H1 is not an animation layer",
);
assert.ok(!homeH1.includes("aria-hidden"), "Server H1 is visible to agents");
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
assert.equal(openApi.headers.get("x-robots-tag"), "noindex");
const openApiBody = await openApi.json();
assert.equal(openApiBody.openapi, "3.1.1");
assert.ok(openApiBody.info.title.includes("LPM CLI"));
assert.ok(openApiBody.paths["/api/v1/search"]);
assert.equal(openApiBody.paths["/api/search"].get.deprecated, true);
assert.ok(
  openApiBody.components.responses.SearchSuccess.headers["RateLimit-Policy"],
);
assert.ok(openApiBody.components.responses.RateLimited.headers["Retry-After"]);

const schema = await request("/schemas/lpm.json");
assert.equal(schema.status, 200);
assert.equal(schema.headers.get("x-robots-tag"), "noindex");
assert.match(
  schema.headers.get("content-type") || "",
  /application\/schema\+json/,
);

for (const method of ["POST", "OPTIONS"]) {
  const schemaMethod = await request("/schemas/lpm.json", { method });
  assert.equal(schemaMethod.status, 405);
  assert.equal(schemaMethod.headers.get("allow"), "GET, HEAD");
  assert.equal(schemaMethod.headers.get("cache-control"), "no-store");
  assert.equal(schemaMethod.headers.get("x-robots-tag"), "noindex");
  assert.match(
    schemaMethod.headers.get("content-type") || "",
    /application\/problem\+json/,
  );
  assert.equal((await schemaMethod.json()).code, "METHOD_NOT_ALLOWED");
}

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

const search = await request("/api/v1/search?query=install&limit=1");
assert.equal(search.status, 200);
assert.equal(search.headers.get("x-robots-tag"), "noindex");
assert.equal(search.headers.get("ratelimit-policy"), '"docs-search";q=60;w=60');
assert.match(
  search.headers.get("ratelimit") || "",
  /^"docs-search";r=\d+;t=\d+$/,
);
assert.equal(search.headers.get("cache-control"), "private, no-store");
assert.ok(Array.isArray(await search.json()));

const searchMethod = await request("/api/v1/search", { method: "POST" });
assert.equal(searchMethod.status, 405);
assert.equal(searchMethod.headers.get("x-robots-tag"), "noindex");
assert.equal(searchMethod.headers.get("allow"), "GET, HEAD, OPTIONS");
assert.equal((await searchMethod.json()).code, "METHOD_NOT_ALLOWED");

const legacySearch = await request("/api/search?query=install&limit=1");
assert.equal(legacySearch.status, 200);
assert.equal(legacySearch.headers.get("x-robots-tag"), "noindex");
assert.equal(legacySearch.headers.get("deprecation"), "@1787529600");
assert.match(legacySearch.headers.get("link") || "", /rel="deprecation"/);
assert.ok(Array.isArray(await legacySearch.json()));

for (const path of ["/api/search", "/openapi.json"]) {
  const unsupportedMethod = await request(path, { method: "POST" });
  assert.equal(unsupportedMethod.status, 405);
  assert.equal(unsupportedMethod.headers.get("x-robots-tag"), "noindex");
  assert.equal(
    unsupportedMethod.headers.get("allow"),
    path === "/openapi.json" ? "GET, HEAD" : "GET, HEAD, OPTIONS",
  );
  await unsupportedMethod.arrayBuffer();
}

for (const [path, expectedStatus] of [
  ["/api/v1/search", 204],
  ["/api/search", 204],
  ["/openapi.json", 405],
]) {
  const options = await request(path, { method: "OPTIONS" });
  assert.equal(options.status, expectedStatus);
  assert.equal(options.headers.get("x-robots-tag"), "noindex");
  assert.equal(
    options.headers.get("allow"),
    path === "/openapi.json" ? "GET, HEAD" : "GET, HEAD, OPTIONS",
  );
  await options.arrayBuffer();
}

const rateLimitClient = { "x-forwarded-for": "198.51.100.77" };
const firstLimitedSearch = await request("/api/v1/search", {
  headers: rateLimitClient,
});
assert.equal(firstLimitedSearch.status, 200);
const firstRateLimit = firstLimitedSearch.headers
  .get("ratelimit")
  ?.match(/^"docs-search";r=(\d+);t=(\d+)$/);
assert.ok(firstRateLimit, "Search returns a parseable RateLimit field");
await firstLimitedSearch.arrayBuffer();

const remainingQuota = Number(firstRateLimit[1]);
for (let requestIndex = 0; requestIndex < remainingQuota; requestIndex += 1) {
  const accepted = await request("/api/v1/search", {
    headers: rateLimitClient,
  });
  assert.equal(accepted.status, 200);
  await accepted.arrayBuffer();
}

const throttledSearch = await request("/api/v1/search", {
  headers: rateLimitClient,
});
assert.equal(throttledSearch.status, 429);
assert.match(
  throttledSearch.headers.get("content-type") || "",
  /application\/problem\+json/,
);
const retryAfter = Number(throttledSearch.headers.get("retry-after"));
assert.ok(Number.isInteger(retryAfter) && retryAfter > 0);
assert.equal(
  throttledSearch.headers.get("ratelimit"),
  `"docs-search";r=0;t=${retryAfter}`,
);
const throttledBody = await throttledSearch.json();
assert.equal(throttledBody.code, "RATE_LIMIT_EXCEEDED");
assert.equal(
  throttledBody.type,
  "https://iana.org/assignments/http-problem-types#quota-exceeded",
);
assert.deepEqual(throttledBody["violated-policies"], ["docs-search"]);

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
  "https://cli.lpm.dev/api/v1/search",
);

const catalogHead = await request("/.well-known/api-catalog", {
  method: "HEAD",
});
assert.equal(catalogHead.status, 200);
assert.match(catalogHead.headers.get("link") || "", /rel="item"/);

const developerResources = await request("/docs/developer-resources");
assert.equal(developerResources.status, 200);
const developerResourcesBody = await developerResources.text();
assert.ok(developerResourcesBody.includes("LPM CLI developer resources"));
assert.ok(developerResourcesBody.includes("/api/v1/search"));
assert.ok(developerResourcesBody.includes("Versioning and deprecation"));
assert.ok(developerResourcesBody.includes("RateLimit-Policy"));

console.log(`Agent-readiness integration checks passed for ${origin}`);
