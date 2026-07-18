/* @vitest-environment jsdom */

import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PostHogProvider from "../../components/posthog-provider";

const mocks = vi.hoisted(() => ({
  getPostHogClient: vi.fn(),
  navigation: {
    pathname: "/docs/first",
    searchParams: new URLSearchParams(),
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.navigation.pathname,
  useSearchParams: () => mocks.navigation.searchParams,
}));

vi.mock("@/lib/posthog/client", () => ({
  getPostHogClient: mocks.getPostHogClient,
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

afterEach(() => {
  cleanup();
  mocks.getPostHogClient.mockReset();
  mocks.navigation.pathname = "/docs/first";
  mocks.navigation.searchParams = new URLSearchParams();
});

describe("PostHogProvider", () => {
  it("suppresses a stale pageview after navigation", async () => {
    const first = deferred<{ capture: ReturnType<typeof vi.fn> } | null>();
    const second = deferred<{ capture: ReturnType<typeof vi.fn> } | null>();
    const capture = vi.fn();
    mocks.getPostHogClient
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const view = render(
      <PostHogProvider>
        <main>Page</main>
      </PostHogProvider>,
    );
    await waitFor(() =>
      expect(mocks.getPostHogClient).toHaveBeenCalledTimes(1),
    );

    mocks.navigation.pathname = "/docs/second";
    mocks.navigation.searchParams = new URLSearchParams("q=search");
    view.rerender(
      <PostHogProvider>
        <main>Page</main>
      </PostHogProvider>,
    );
    await waitFor(() =>
      expect(mocks.getPostHogClient).toHaveBeenCalledTimes(2),
    );

    await act(async () => first.resolve({ capture }));
    expect(capture).not.toHaveBeenCalled();

    await act(async () => second.resolve({ capture }));
    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith("$pageview", {
      $current_url: `${window.origin}/docs/second?q=search`,
    });
  });
});
