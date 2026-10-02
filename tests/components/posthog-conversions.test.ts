/* @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";

const capture = vi.hoisted(() => vi.fn());
vi.mock("@/lib/posthog/client", () => ({
  getPostHogClient: () => Promise.resolve({ capture }),
}));

import { observeConversionLinks } from "@/lib/posthog/conversions";

afterEach(() => {
  capture.mockClear();
  document.body.innerHTML = "";
});
describe("public conversion links", () => {
  it("captures intent without unrelated destination queries", async () => {
    document.body.innerHTML =
      '<a href="/docs/installation?token=private">Continue</a>';
    const stop = observeConversionLinks();
    const link = document.querySelector("a");
    link?.addEventListener("click", (event) => event.preventDefault());
    link?.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
    await Promise.resolve();
    expect(capture).toHaveBeenCalledWith(
      "cli_install_guide_clicked",
      expect.objectContaining({
        app: "cli",
        destination_path: "/docs/installation",
        attribution_version: 2,
      }),
      expect.objectContaining({ transport: "sendBeacon" }),
    );
    expect(JSON.stringify(capture.mock.calls)).not.toContain("private");
    stop();
  });
  it("ignores unrelated documentation links", async () => {
    document.body.innerHTML = '<a href="/docs/reference">Read</a>';
    const stop = observeConversionLinks();
    const link = document.querySelector("a");
    link?.addEventListener("click", (event) => event.preventDefault());
    link?.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
    await Promise.resolve();
    expect(capture).not.toHaveBeenCalled();
    stop();
  });
});
