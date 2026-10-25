import { isDraining } from "@/server-drain.mjs";

/**
 * Docker's health check. It fails while the server drains, so Docker marks
 * the container unhealthy and Traefik stops routing to it. It reads no data:
 * the check runs every few seconds.
 */
export function readinessResponse(): Response {
  const draining = isDraining();
  return Response.json(
    { status: draining ? "draining" : "ready" },
    {
      status: draining ? 503 : 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
