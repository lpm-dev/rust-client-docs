/* @vitest-environment jsdom */

import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const DIALOG = "fumadocs-ui/components/dialog/search-default";
const loads = vi.hoisted(() => ({ count: 0, fail: false }));

async function renderPreload() {
  const { SearchPreload, preloadSearchDialog } = await import(
    "@/components/search-preload"
  );
  const view = render(
    <>
      <SearchPreload />
      <button type="button" data-search-full="">
        <span>Search</span>
      </button>
      <button type="button" data-search="">
        Search
      </button>
      <button type="button">Copy</button>
    </>,
  );
  return { ...view, preloadSearchDialog };
}

/** Lets the dynamic import settle. */
async function settle() {
  await vi.dynamicImportSettled();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

beforeEach(() => {
  vi.resetModules();
  loads.count = 0;
  loads.fail = false;
  vi.doMock(DIALOG, () => {
    loads.count++;
    if (loads.fail) throw new Error("network");
    return { default: () => null };
  });
});

afterEach(() => {
  cleanup();
  vi.doUnmock(DIALOG);
});

describe("SearchPreload", () => {
  it("leaves the search dialog unloaded until someone reaches for search", async () => {
    const { getByText } = await renderPreload();

    fireEvent.pointerOver(getByText("Copy"));
    fireEvent.focusIn(getByText("Copy"));
    fireEvent.keyDown(document, { key: "k" });
    await settle();

    expect(loads.count).toBe(0);
  });

  it.each([
    [
      "a pointer reaches a search button",
      (button: Element) => fireEvent.pointerOver(button.firstChild ?? button),
    ],
    [
      "a pointer presses a search button",
      (button: Element) => fireEvent.pointerDown(button),
    ],
    [
      "a search button gets focus",
      (button: Element) => fireEvent.focusIn(button),
    ],
    [
      "⌘ goes down",
      () => fireEvent.keyDown(document, { key: "Meta", metaKey: true }),
    ],
    [
      "Ctrl goes down",
      () => fireEvent.keyDown(document, { key: "Control", ctrlKey: true }),
    ],
  ])("loads it when %s", async (_label, act) => {
    await renderPreload();

    act(document.querySelector("[data-search-full]") as Element);
    await settle();

    expect(loads.count).toBe(1);
  });

  it("loads it once", async () => {
    const { getByText } = await renderPreload();

    fireEvent.pointerOver(getByText("Search", { selector: "span" }));
    fireEvent.focusIn(document.querySelector("[data-search]") as Element);
    fireEvent.keyDown(document, { key: "Meta", metaKey: true });
    await settle();

    expect(loads.count).toBe(1);
  });

  it("tries again after a failed load", async () => {
    loads.fail = true;
    const { preloadSearchDialog } = await renderPreload();

    await preloadSearchDialog();
    loads.fail = false;
    await preloadSearchDialog();

    expect(loads.count).toBe(2);
  });
});
