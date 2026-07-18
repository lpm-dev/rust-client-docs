/* @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  init: vi.fn(),
}));

vi.mock("posthog-js", () => ({
  default: { init: mocks.init },
}));

const originalKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

beforeEach(() => {
  vi.resetModules();
  mocks.init.mockReset();
  localStorage.clear();
  process.env.NEXT_PUBLIC_POSTHOG_KEY = "test-key";
});

afterEach(() => {
  vi.restoreAllMocks();
  if (originalKey === undefined) {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
  } else {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = originalKey;
  }
});

describe("getPostHogClient", () => {
  it("resolves safely after failure and retries on the next call", async () => {
    mocks.init
      .mockImplementationOnce(() => {
        throw new Error("initialization failed");
      })
      .mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { getPostHogClient } = await import("../../lib/posthog/client");

    await expect(getPostHogClient()).resolves.toBeNull();
    await expect(getPostHogClient()).resolves.not.toBeNull();

    expect(mocks.init).toHaveBeenCalledTimes(2);
    expect(error).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith("PostHog initialization failed");
  });
});
