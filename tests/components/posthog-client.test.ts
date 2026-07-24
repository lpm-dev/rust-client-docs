/* @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  init: vi.fn(),
}));

vi.mock("posthog-js", () => ({
  default: { init: mocks.init },
}));

const originalKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const originalLocalStorage = Object.getOwnPropertyDescriptor(
  window,
  "localStorage",
);
const storedValues = new Map<string, string>();
const localStorageMock: Storage = {
  get length() {
    return storedValues.size;
  },
  clear() {
    storedValues.clear();
  },
  getItem(key) {
    return storedValues.get(key) ?? null;
  },
  key(index) {
    return [...storedValues.keys()][index] ?? null;
  },
  removeItem(key) {
    storedValues.delete(key);
  },
  setItem(key, value) {
    storedValues.set(key, value);
  },
};

beforeEach(() => {
  vi.resetModules();
  mocks.init.mockReset();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: localStorageMock,
  });
  window.localStorage.clear();
  process.env.NEXT_PUBLIC_POSTHOG_KEY = "test-key";
});

afterEach(() => {
  vi.restoreAllMocks();
  if (originalLocalStorage) {
    Object.defineProperty(window, "localStorage", originalLocalStorage);
  } else {
    Reflect.deleteProperty(window, "localStorage");
  }
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
