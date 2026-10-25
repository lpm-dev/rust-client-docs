// The custom server and the readiness route run in one process but load this
// module separately (the route through Next's bundle), so the state lives on
// globalThis under a registered symbol.
const DRAINING = Symbol.for("lpm.docs.draining");

/** The signal Docker sends to stop the container (STOPSIGNAL in the Dockerfile). */
export const DRAIN_SIGNAL = "SIGUSR2";

export function isDraining() {
  return globalThis[DRAINING] === true;
}

export function startDraining() {
  globalThis[DRAINING] = true;
}

/** For tests. */
export function stopDraining() {
  delete globalThis[DRAINING];
}
