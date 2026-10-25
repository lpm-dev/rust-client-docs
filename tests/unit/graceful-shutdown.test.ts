import { EventEmitter, once } from "node:events";
import { createServer, request, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { drainMsFrom, installGracefulShutdown } from "@/server.mjs";
import { DRAIN_SIGNAL, isDraining, stopDraining } from "@/server-drain.mjs";

type Shutdown = { isClosing: () => boolean };

/** A server whose /slow requests answer after `slowMs`, or never when 0. */
async function serve(slowMs: number) {
  let shutdown: Shutdown | undefined;
  const server: Server = createServer((incoming, response) => {
    if (shutdown?.isClosing()) response.shouldKeepAlive = false;
    if (incoming.url === "/slow") {
      if (slowMs > 0) setTimeout(() => response.end("slow"), slowMs);
      return;
    }
    response.end("fast");
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address() as AddressInfo;
  return {
    server,
    port,
    attach(value: Shutdown) {
      shutdown = value;
    },
  };
}

function get(port: number, path: string) {
  return new Promise<{ status: number; body: string }>((resolve, reject) => {
    const outgoing = request(
      { host: "127.0.0.1", port, path, agent: false },
      (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () =>
          resolve({ status: response.statusCode ?? 0, body }),
        );
      },
    );
    outgoing.on("error", reject);
    outgoing.end();
  });
}

function install(server: Server, drainMs: number, forceMs = 2_000) {
  const signals = new EventEmitter();
  const exits: number[] = [];
  let exited: (code: number) => void = () => {};
  const exitedPromise = new Promise<number>((resolve) => {
    exited = resolve;
  });
  const shutdown = installGracefulShutdown({
    server,
    drainMs,
    forceMs,
    signals,
    exit: (code: number) => {
      exits.push(code);
      exited(code);
    },
    log: () => {},
  });
  return { signals, shutdown, exits, exited: exitedPromise };
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("installGracefulShutdown", () => {
  afterEach(stopDraining);

  it("fails readiness on the drain signal, then closes once open requests finish", async () => {
    const { server, port, attach } = await serve(150);
    const { signals, shutdown, exited } = install(server, 50);
    attach(shutdown);

    const slow = get(port, "/slow");
    await wait(20);
    signals.emit(DRAIN_SIGNAL);
    expect(isDraining()).toBe(true);
    expect(shutdown.isClosing()).toBe(false);
    expect(await get(port, "/fast")).toEqual({ status: 200, body: "fast" });

    expect(await slow).toEqual({ status: 200, body: "slow" });
    expect(await exited).toBe(0);
    expect(server.listening).toBe(false);
  });

  it("closes at once on SIGTERM and still finishes open requests", async () => {
    const { server, port, attach } = await serve(100);
    const { signals, shutdown, exited, exits } = install(server, 60_000);
    attach(shutdown);

    const slow = get(port, "/slow");
    await wait(20);
    signals.emit("SIGTERM");
    signals.emit("SIGTERM");
    expect(shutdown.isClosing()).toBe(true);
    expect(isDraining()).toBe(false);

    expect(await slow).toEqual({ status: 200, body: "slow" });
    expect(await exited).toBe(0);
    expect(exits).toEqual([0]);
  });

  it("cuts requests still open after the force deadline", async () => {
    const { server, port, attach } = await serve(0);
    const { signals, shutdown, exited } = install(server, 0, 100);
    attach(shutdown);

    const hung = get(port, "/slow").catch(
      (error: NodeJS.ErrnoException) => error.code,
    );
    await wait(20);
    signals.emit("SIGTERM");

    expect(await exited).toBe(1);
    expect(await hung).toBe("ECONNRESET");
  });
});

describe("drainMsFrom", () => {
  it("reads the drain period from the environment", () => {
    expect(drainMsFrom(undefined)).toBe(0);
    expect(drainMsFrom("")).toBe(0);
    expect(drainMsFrom("12000")).toBe(12_000);
    for (const value of ["-1", "1.5", "soon"]) {
      expect(() => drainMsFrom(value)).toThrow(
        /Invalid DOCS_SHUTDOWN_DRAIN_MS/,
      );
    }
  });
});
