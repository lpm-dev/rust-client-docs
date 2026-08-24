/* @vitest-environment jsdom */

import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TypedHero } from "../../app/(home)/_components/typed-hero";

function setReducedMotion(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockReturnValue({ matches }),
  });
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  cleanup();
});

describe("TypedHero", () => {
  it("starts the visual typing layer after hydration", () => {
    vi.useFakeTimers();
    setReducedMotion(false);

    const view = render(<TypedHero />);
    const heading = screen.getByRole("heading", {
      name: "The fast, all-in-one toolkit for modern software.",
    });

    expect(heading.classList.contains("hero-is-typing")).toBe(true);
    expect(
      view.container.querySelector(".hero-typed")?.getAttribute("aria-hidden"),
    ).toBe("true");

    act(() => vi.runAllTimers());
    expect(view.container.querySelector(".hero-typed")?.textContent).toContain(
      "for modern software.",
    );
  });

  it("keeps the complete static heading for reduced motion", () => {
    setReducedMotion(true);

    const view = render(<TypedHero />);
    const heading = screen.getByRole("heading", {
      name: "The fast, all-in-one toolkit for modern software.",
    });

    expect(heading.classList.contains("hero-is-typing")).toBe(false);
    expect(view.container.querySelector(".hero-typed")).toBeNull();
  });
});
