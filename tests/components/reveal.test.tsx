/* @vitest-environment jsdom */

import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Reveal } from "../../app/(home)/_components/reveal";

const originalIntersectionObserver = globalThis.IntersectionObserver;

function setReducedMotion(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockReturnValue({
      matches,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  if (originalIntersectionObserver) {
    Object.defineProperty(globalThis, "IntersectionObserver", {
      configurable: true,
      value: originalIntersectionObserver,
    });
  } else {
    Reflect.deleteProperty(globalThis, "IntersectionObserver");
  }
});

describe("Reveal", () => {
  it("server-renders visible content without an enhancement state", () => {
    const html = renderToString(<Reveal>Content</Reveal>);

    expect(html).toContain('class="reveal"');
    expect(html).not.toContain("reveal-pending");
    expect(html).not.toContain('class="reveal in"');
  });

  it("stays visible when IntersectionObserver is unavailable", async () => {
    setReducedMotion(false);
    Reflect.deleteProperty(globalThis, "IntersectionObserver");

    render(<Reveal>Content</Reveal>);
    const content = screen.getByText("Content");
    await waitFor(() => expect(content.className).toBe("reveal"));
  });

  it("stays visible when reduced motion is requested", async () => {
    setReducedMotion(true);
    const observe = vi.fn();
    Object.defineProperty(globalThis, "IntersectionObserver", {
      configurable: true,
      value: vi.fn(function MockObserver() {
        return { observe, disconnect: vi.fn() };
      }),
    });

    render(<Reveal>Content</Reveal>);
    const content = screen.getByText("Content");
    await waitFor(() => expect(content.className).toBe("reveal"));
    expect(observe).not.toHaveBeenCalled();
  });

  it("opts into the pending state and reveals once on intersection", async () => {
    setReducedMotion(false);
    let callback: IntersectionObserverCallback | undefined;
    const observe = vi.fn();
    const disconnect = vi.fn();
    Object.defineProperty(globalThis, "IntersectionObserver", {
      configurable: true,
      value: vi.fn(function MockObserver(
        observerCallback: IntersectionObserverCallback,
      ) {
        callback = observerCallback;
        return { observe, disconnect };
      }),
    });

    render(<Reveal>Content</Reveal>);
    const content = screen.getByText("Content");
    await waitFor(() => expect(content.className).toContain("reveal-pending"));
    expect(observe).toHaveBeenCalledWith(content);

    act(() => {
      callback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });

    expect(content.className).toBe("reveal in");
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
