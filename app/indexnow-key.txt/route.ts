// Serves the IndexNow ownership key so participating search engines can
// verify we own cli.lpm.dev before accepting notifications. Returning plain
// text with no other content is required by the spec.

export const dynamic = "force-static";
export const revalidate = 3600;

export function GET(): Response {
  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    return new Response("Not configured", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  return new Response(key, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
