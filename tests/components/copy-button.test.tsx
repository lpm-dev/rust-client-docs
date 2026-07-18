/* @vitest-environment jsdom */

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CopyButton } from "../../app/(home)/_components/copy-button";

function setClipboard(
  clipboard: { writeText: ReturnType<typeof vi.fn> } | undefined,
) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: clipboard,
  });
}

afterEach(() => {
  vi.useRealTimers();
  cleanup();
  setClipboard(undefined);
  vi.restoreAllMocks();
});

describe("CopyButton", () => {
  it("reports success only after writing the install command", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });

    render(<CopyButton />);
    const button = screen.getByRole("button", {
      name: "Copy install command",
    });
    expect(button.textContent).toBe("Copy");
    expect(screen.getByRole("status").textContent).toBe("");

    await userEvent.click(button);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        "curl -fsSL https://cli.lpm.dev/install | sh",
      );
      expect(button.textContent).toBe("Copied ✓");
    });
    expect(screen.getByRole("status").textContent).toBe(
      "Install command copied to clipboard.",
    );
  });

  it("reports a rejected clipboard write without claiming success", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    setClipboard({ writeText });

    render(<CopyButton />);
    const button = screen.getByRole("button", {
      name: "Copy install command",
    });
    await userEvent.click(button);

    await waitFor(() => expect(button.textContent).toBe("Copy failed"));
    expect(button.textContent).not.toContain("Copied");
    expect(screen.getByRole("status").textContent).toBe(
      "Could not copy the install command. Select it and copy it manually.",
    );
  });

  it("reports failure when the Clipboard API is unavailable", async () => {
    setClipboard(undefined);

    render(<CopyButton />);
    const button = screen.getByRole("button", {
      name: "Copy install command",
    });
    await userEvent.click(button);

    await waitFor(() => expect(button.textContent).toBe("Copy failed"));
    expect(screen.getByRole("status").textContent).toContain(
      "Select it and copy it manually.",
    );
  });

  it("resets from the most recent result timer", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });

    render(<CopyButton />);
    const button = screen.getByRole("button", {
      name: "Copy install command",
    });

    await act(async () => {
      fireEvent.click(button);
      await Promise.resolve();
    });
    expect(button.textContent).toBe("Copied ✓");

    act(() => vi.advanceTimersByTime(1000));
    await act(async () => {
      fireEvent.click(button);
      await Promise.resolve();
    });
    act(() => vi.advanceTimersByTime(700));
    expect(button.textContent).toBe("Copied ✓");

    act(() => vi.advanceTimersByTime(900));
    expect(button.textContent).toBe("Copy");
  });
});
