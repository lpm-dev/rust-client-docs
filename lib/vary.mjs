/**
 * Merge field names into a Vary header value without dropping existing values.
 * Field names are case-insensitive, and Vary: * takes precedence over a list.
 *
 * @param {string | number | readonly string[] | undefined} existing
 * @param {...string} fieldNames
 */
export function mergeVary(existing, ...fieldNames) {
  const existingValues = Array.isArray(existing) ? existing : [existing];
  const values = [
    ...existingValues.flatMap((value) => String(value ?? "").split(",")),
    ...fieldNames.flatMap((value) => value.split(",")),
  ];
  const unique = new Map();

  for (const value of values) {
    const fieldName = value.trim();
    if (!fieldName) continue;
    if (fieldName === "*") return "*";

    const key = fieldName.toLowerCase();
    if (!unique.has(key)) unique.set(key, fieldName);
  }

  return [...unique.values()].join(", ");
}

/**
 * Prepare the origin Vary value for a CDN that owns response compression.
 * Accept-Encoding is removed because Cloudflare adds its own final variance.
 *
 * @param {string | number | readonly string[] | undefined} existing
 * @param {{ accept?: boolean }} options
 */
export function normalizeOriginVary(existing, { accept = false } = {}) {
  const values = Array.isArray(existing) ? existing : [existing];
  const unique = new Map();

  for (const value of values) {
    for (const token of String(value ?? "").split(",")) {
      const fieldName = token.trim();
      if (!fieldName) continue;
      if (fieldName === "*") return "*";

      const key = fieldName.toLowerCase();
      if (key === "accept-encoding") continue;
      if (!unique.has(key)) unique.set(key, fieldName);
    }
  }

  if (accept && !unique.has("accept")) unique.set("accept", "Accept");
  return [...unique.values()].join(", ");
}

/**
 * Add one or more field names to a Headers object.
 *
 * @param {Headers} headers
 * @param {...string} fieldNames
 */
export function appendVary(headers, ...fieldNames) {
  const value = mergeVary(headers.get("Vary") ?? undefined, ...fieldNames);
  if (value) headers.set("Vary", value);
}
