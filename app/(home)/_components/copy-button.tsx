"use client";

import { useEffect, useRef, useState } from "react";

const INSTALL_CMD = "curl -fsSL https://cli.lpm.dev/install | sh";
const RESET_MS = 1600;

type CopyState = "idle" | "copied" | "error";

export function CopyButton() {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    let nextState: CopyState = "copied";

    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(INSTALL_CMD);
    } catch {
      nextState = "error";
    }

    setCopyState(nextState);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopyState("idle"), RESET_MS);
  }

  const statusMessage =
    copyState === "copied"
      ? "Install command copied to clipboard."
      : copyState === "error"
        ? "Could not copy the install command. Select it and copy it manually."
        : "";

  return (
    <>
      <button
        type="button"
        className="copybtn"
        aria-label="Copy install command"
        onClick={() => void copy()}
      >
        {copyState === "copied"
          ? "Copied ✓"
          : copyState === "error"
            ? "Copy failed"
            : "Copy"}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {statusMessage}
      </span>
    </>
  );
}
