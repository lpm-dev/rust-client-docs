"use client";

import { useEffect, useRef, useState } from "react";

const INSTALL_CMD = "curl -fsSL https://cli.lpm.dev/install | sh";
const RESET_MS = 1600;

export function CopyButton() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function copy() {
    // Optional chaining short-circuits the whole chain when clipboard is
    // unavailable (insecure context), so .catch never runs on undefined.
    void navigator.clipboard?.writeText(INSTALL_CMD).catch(() => {});
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), RESET_MS);
  }

  return (
    <button type="button" className="copybtn" onClick={copy}>
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}
