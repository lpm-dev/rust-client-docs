/* @vitest-environment jsdom */

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SiteHeader } from "../../components/site-header";

vi.mock("next/navigation", () => ({
  usePathname: () => "/docs",
}));

vi.mock("fumadocs-ui/layouts/shared/slots/search-trigger", () => ({
  FullSearchTrigger: () => null,
}));

vi.mock("fumadocs-ui/layouts/shared/slots/theme-switch", () => ({
  ThemeSwitch: () => null,
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("SiteHeader mobile navigation", () => {
  it("restores trigger focus when Escape closes the disclosure", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);

    const trigger = screen.getByRole("button", {
      name: "Open section menu",
    });
    expect(trigger.hasAttribute("aria-haspopup")).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.getAttribute("aria-controls")).toBe("site-section-menu");

    await user.click(trigger);
    const navigation = screen.getByRole("navigation", {
      name: "Section navigation",
    });
    const packages = within(navigation).getByRole("link", { name: "Packages" });
    packages.focus();
    expect(document.activeElement).toBe(packages);

    await user.keyboard("{Escape}");

    expect(
      screen.queryByRole("navigation", { name: "Section navigation" }),
    ).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("does not steal focus when an outside pointer closes the disclosure", async () => {
    const user = userEvent.setup();
    render(
      <>
        <SiteHeader />
        <button type="button">Outside</button>
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Open section menu" }));
    const outside = screen.getByRole("button", { name: "Outside" });
    await user.click(outside);

    expect(
      screen.queryByRole("navigation", { name: "Section navigation" }),
    ).toBeNull();
    expect(document.activeElement).toBe(outside);
  });
});
