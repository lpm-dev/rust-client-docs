/**
 * Wraps markdown text in a Response with the agent-facing headers shared by
 * every markdown surface: `text/markdown` content type, noindex (the markdown
 * mirrors must never compete with canonical HTML in search), and an
 * `x-markdown-tokens` estimate (~4 chars/token) so agents can budget context
 * before fetching the body.
 */
export function markdownResponse(text: string): Response {
  return new Response(text, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "X-Robots-Tag": "noindex",
      "x-markdown-tokens": String(Math.ceil(text.length / 4)),
    },
  });
}
