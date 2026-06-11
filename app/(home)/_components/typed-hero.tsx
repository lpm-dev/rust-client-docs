"use client";

import { useEffect, useState } from "react";

const SEGMENTS = [
  { text: "The fast,\nall-in-one toolkit ", muted: false },
  { text: "for modern software.", muted: true },
] as const;

const FULL_TEXT = SEGMENTS.map((segment) => segment.text).join("");
const TOTAL = FULL_TEXT.length;
const ARIA_LABEL = FULL_TEXT.replace(/\n/g, " ");
const STEP_MS = 34;

export function TypedHero() {
  // Server-render the full text so crawlers and the first paint get the
  // complete headline; the typing animation only starts after hydration.
  const [count, setCount] = useState(TOTAL);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduced) {
      setShowCursor(false);
      return;
    }

    setCount(0);

    let typed = 0;
    const id = window.setInterval(() => {
      typed += 1;
      setCount(typed);
      if (typed >= TOTAL) window.clearInterval(id);
    }, STEP_MS);

    return () => window.clearInterval(id);
  }, []);

  let remaining = count;

  return (
    // `white-space: pre-wrap` (in home.css) turns the literal "\n" in the
    // first segment into the line break, so the typed text needs no <br> nodes.
    // data-text feeds the invisible ::before sizer that holds the finished
    // height while the absolutely-positioned .hero-typed layer types, so the
    // page below never reflows during the animation.
    <h1 className="hero" aria-label={ARIA_LABEL} data-text={FULL_TEXT}>
      <span className="hero-typed" aria-hidden="true">
        {SEGMENTS.map((segment) => {
          const take = Math.max(0, Math.min(segment.text.length, remaining));
          remaining -= take;
          return (
            <span
              key={segment.text}
              className={segment.muted ? "light" : undefined}
            >
              {segment.text.slice(0, take)}
            </span>
          );
        })}
        {showCursor ? <span className="cursor hero-cursor" /> : null}
      </span>
    </h1>
  );
}
