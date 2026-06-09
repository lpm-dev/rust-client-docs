"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

type RevealProps = {
  as?: "div" | "section";
  id?: string;
  className?: string;
  children: ReactNode;
};

export function Reveal({ as = "div", id, className, children }: RevealProps) {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.01 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  const classes = cn("reveal", inView && "in", className);

  if (as === "section") {
    return (
      <section ref={setNode} id={id} className={classes}>
        {children}
      </section>
    );
  }

  return (
    <div ref={setNode} id={id} className={classes}>
      {children}
    </div>
  );
}
