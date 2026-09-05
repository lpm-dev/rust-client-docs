import assert from "node:assert/strict";

const origin = (
  process.env.CONTENT_NEGOTIATION_ORIGIN || "http://127.0.0.1:3000"
).replace(/\/$/, "");
const htmlPath = "/docs/packages/install";
const markdownPath = `${htmlPath}.mdx`;
const missingPath = "/not-a-real-page";

function request(path, accept) {
  return fetch(`${origin}${path}`, {
    headers: { Accept: accept },
    redirect: "manual",
  });
}

function varyTokens(response) {
  return (response.headers.get("Vary") || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function assertVariesOnAccept(response) {
  const tokens = varyTokens(response);
  assert.ok(tokens.includes("accept"), "Vary includes Accept");
  assert.equal(
    tokens.filter((token) => token === "accept").length,
    1,
    "Vary includes Accept exactly once",
  );
  assert.equal(new Set(tokens).size, tokens.length, "Vary has no duplicates");
}

function assertDoesNotVaryOnAccept(response) {
  assert.ok(
    !varyTokens(response).includes("accept"),
    "fixed representations do not vary on Accept",
  );
}

async function assertHtml() {
  const response = await request(htmlPath, "text/html");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") || "", /^text\/html\b/);
  assertVariesOnAccept(response);
  const body = await response.text();
  assert.match(
    body,
    /<link rel="canonical" href="https:\/\/cli\.lpm\.dev\/docs\/packages\/install"/,
  );
  assert.match(body, /<h1\b[^>]*>lpm install<\/h1>/i);
}

async function assertNegotiatedMarkdown() {
  const response = await request(htmlPath, "text/markdown");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") || "", /^text\/markdown\b/);
  assert.equal(response.headers.get("x-robots-tag"), "noindex");
  assertVariesOnAccept(response);
  assert.match(
    await response.text(),
    /^# lpm install \(\/docs\/packages\/install\)/,
  );
}

async function assertExplicitMarkdown(accept) {
  const response = await request(markdownPath, accept);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") || "", /^text\/markdown\b/);
  assert.equal(response.headers.get("x-robots-tag"), "noindex");
  assert.match(
    response.headers.get("link") || "",
    /<\/docs\/packages\/install>; rel="alternate"; type="text\/html"/,
  );
  assertDoesNotVaryOnAccept(response);
  assert.match(
    await response.text(),
    /^# lpm install \(\/docs\/packages\/install\)/,
  );
}

async function assertMissingHtml() {
  const response = await request(missingPath, "text/html");
  assert.equal(response.status, 404);
  assert.match(response.headers.get("content-type") || "", /^text\/html\b/);
  assertVariesOnAccept(response);
}

async function assertMissingMarkdown() {
  const response = await request(missingPath, "text/markdown");
  assert.equal(response.status, 404);
  assert.match(response.headers.get("content-type") || "", /^text\/markdown\b/);
  assert.equal(response.headers.get("x-robots-tag"), "noindex");
  assertVariesOnAccept(response);
}

// Exercise both cache orders so one representation cannot poison the other.
await assertNegotiatedMarkdown();
await assertHtml();
await assertHtml();
await assertNegotiatedMarkdown();
await assertExplicitMarkdown("text/html");
await assertExplicitMarkdown("application/json");
await assertMissingMarkdown();
await assertMissingHtml();

console.log(`Content-negotiation integration checks passed for ${origin}`);
