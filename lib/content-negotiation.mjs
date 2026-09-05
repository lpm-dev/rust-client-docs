const MARKDOWN_404_EXCLUDED_PREFIXES = [
  "/api/",
  "/a/",
  "/og/",
  "/.well-known/",
  "/llms.mdx/",
];

/** @param {string} pathname */
export function canNegotiateMissingHtml(pathname) {
  const finalSegment = pathname.split("/").at(-1) || "";
  if (finalSegment.includes(".")) return false;
  if (pathname === "/install") return false;
  if (pathname === "/api") return false;

  return !MARKDOWN_404_EXCLUDED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
}

/** @param {string | undefined} rawUrl */
export function negotiatesOnAccept(rawUrl) {
  const pathname = new URL(rawUrl ?? "/", "http://next.local").pathname;
  if (pathname === "/") return true;

  const normalizedPath =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  if (
    (normalizedPath === "/docs" || normalizedPath.startsWith("/docs/")) &&
    !normalizedPath.endsWith(".mdx")
  ) {
    return true;
  }

  return canNegotiateMissingHtml(pathname);
}
