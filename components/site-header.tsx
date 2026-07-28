"use client";

import { FullSearchTrigger } from "fumadocs-ui/layouts/shared/slots/search-trigger";
import { ThemeSwitch } from "fumadocs-ui/layouts/shared/slots/theme-switch";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { appName, gitConfig } from "@/lib/shared";

type NavItem = {
  label: string;
  href: string;
  matchPrefix?: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Get started", href: "/docs", matchPrefix: "/docs" },
  { label: "Packages", href: "/docs/packages", matchPrefix: "/docs/packages" },
  { label: "Dev", href: "/docs/dev", matchPrefix: "/docs/dev" },
  { label: "Infra", href: "/docs/infra", matchPrefix: "/docs/infra" },
  { label: "Guides", href: "/docs/guides", matchPrefix: "/docs/guides" },
  {
    label: "Reference",
    href: "/docs/reference",
    matchPrefix: "/docs/reference",
  },
];

const TRAILING_ITEMS: NavItem[] = [];
const GITHUB_REPO_URL = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;

// Longest matching prefix wins — so `/docs/packages/install` highlights
// "Packages" (prefix `/docs/packages`, len 14), not "Get started" (prefix
// `/docs`, len 5), even though both prefixes technically match.
function pickActiveItem(
  pathname: string,
  items: NavItem[],
): NavItem | undefined {
  let best: NavItem | undefined;
  let bestLen = -1;
  for (const item of items) {
    const prefix = item.matchPrefix ?? item.href;
    const matches = pathname === prefix || pathname.startsWith(`${prefix}/`);
    if (matches && prefix.length > bestLen) {
      best = item;
      bestLen = prefix.length;
    }
  }
  return best;
}

export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const previousPathnameRef = useRef(pathname);
  const activeNavItem = pickActiveItem(pathname, NAV_ITEMS);
  const activeTrailingItem = pickActiveItem(pathname, TRAILING_ITEMS);

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;
    previousPathnameRef.current = pathname;
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Node && !menuRef.current?.contains(target)) {
        setMenuOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full h-[var(--site-header-height)]",
        "border-b border-fd-border bg-fd-background/80 backdrop-blur-sm",
      )}
    >
      <div className="flex h-full w-full items-center gap-6 px-4 sm:px-6">
        <Link
          href="/"
          aria-label={appName}
          className="flex items-center gap-2 shrink-0"
        >
          <LpmLogo />
          <span className="whitespace-nowrap text-base font-semibold text-fd-foreground">
            LPM{" "}
            <span className="font-normal text-fd-muted-foreground">CLI</span>
          </span>
        </Link>

        <nav className="flex max-[890px]:hidden items-center gap-1 flex-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={item === activeNavItem}
            />
          ))}
        </nav>

        <div className="flex-1 min-[890px]:hidden" />

        <div className="flex items-center gap-2">
          {TRAILING_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={item === activeTrailingItem}
              className="hidden sm:inline-flex"
            />
          ))}
          <FullSearchTrigger
            hideIfDisabled
            className="h-8 w-8 min-w-8 justify-center gap-0 rounded-lg p-0 ps-0 text-[0px] [&>div]:hidden sm:w-auto sm:min-w-[11rem] sm:justify-start sm:gap-2 sm:p-1.5 sm:ps-2 sm:text-xs sm:[&>div]:inline-flex"
          />
          <ThemeSwitch />
          <div ref={menuRef} className="relative">
            <button
              ref={menuButtonRef}
              type="button"
              aria-label={menuOpen ? "Close section menu" : "Open section menu"}
              aria-expanded={menuOpen}
              aria-controls="site-section-menu"
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex items-center justify-center size-9 rounded-md text-fd-muted-foreground hover:text-fd-foreground hover:bg-fd-muted/50 transition-colors min-[890px]:hidden"
            >
              {menuOpen ? (
                <X aria-hidden="true" className="size-4" />
              ) : (
                <Menu aria-hidden="true" className="size-4" />
              )}
            </button>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Open lpm-dev/rust-client on GitHub"
              className="inline-flex max-[890px]:hidden items-center justify-center size-9 rounded-md text-fd-muted-foreground hover:text-fd-foreground hover:bg-fd-muted/50 transition-colors"
            >
              <GitHubMark className="size-4" />
            </a>
            {menuOpen ? (
              <nav
                id="site-section-menu"
                aria-label="Section navigation"
                className={cn(
                  "absolute right-0 top-full mt-2 w-56 rounded-lg border border-fd-border",
                  "bg-fd-background p-1 shadow-lg z-50 min-[890px]:hidden",
                )}
              >
                {NAV_ITEMS.map((item) => (
                  <MenuNavLink
                    key={item.href}
                    item={item}
                    active={item === activeNavItem}
                    onNavigate={() => setMenuOpen(false)}
                  />
                ))}
              </nav>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M12 .5C5.65 .5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.92.58.11.79-.25.79-.56 0-.27-.01-1.16-.02-2.1-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18.92-.26 1.9-.38 2.88-.39.98 0 1.96.13 2.88.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.41-5.27 5.69.42.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.67.8.56C20.71 21.39 24 17.08 24 12 24 5.65 18.85.5 12 .5Z" />
    </svg>
  );
}

function NavLink({
  item,
  active,
  className,
}: {
  item: NavItem;
  active: boolean;
  className?: string;
}) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex items-center h-8 px-3 rounded-md text-sm transition-colors",
        active
          ? "text-fd-foreground"
          : "text-fd-muted-foreground hover:text-fd-foreground hover:bg-fd-muted/50",
        className,
      )}
    >
      {item.label}
    </Link>
  );
}

function MenuNavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "flex items-center rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-fd-muted text-fd-foreground"
          : "text-fd-muted-foreground hover:bg-fd-muted/50 hover:text-fd-foreground",
      )}
    >
      {item.label}
    </Link>
  );
}

function LpmLogo() {
  return (
    <svg viewBox="0 0 36 36" aria-hidden="true" className="size-7">
      <g transform="translate(1, 1)">
        <path
          d="M32.39,4.16 L28.14,5.86 L29.84,1.61 C29.98,1.25 29.94,0.84 29.72,0.52 C29.5,0.19 29.14,0 28.75,0 L5.25,0 C4.86,0 4.5,0.19 4.28,0.52 C4.06,0.84 4.02,1.25 4.16,1.61 L5.86,5.86 L1.61,4.16 C1.25,4.02 0.84,4.06 0.52,4.28 C0.19,4.5 0,4.86 0,5.25 L0,28.75 C0,29.14 0.19,29.5 0.52,29.72 C0.84,29.94 1.25,29.98 1.61,29.84 L5.86,28.14 L4.16,32.39 C4.02,32.75 4.06,33.16 4.28,33.48 C4.5,33.81 4.86,34 5.25,34 L28.75,34 C29.14,34 29.5,33.81 29.72,33.48 C29.94,33.16 29.98,32.75 29.84,32.39 L28.14,28.14 L32.39,29.84 C32.75,29.98 33.16,29.94 33.48,29.72 C33.81,29.5 34,29.14 34,28.75 L34,5.25 C34,4.86 33.81,4.5 33.48,4.28 C33.16,4.06 32.75,4.02 32.39,4.16 Z"
          fill="#2376E3"
        />
        <g transform="translate(5.86, 5.86)" fill="#FFFFFF">
          <path d="M0,0 L3.86,3.86 C3.64,4.08 3.52,4.38 3.52,4.69 L3.52,17.59 C3.52,17.9 3.64,18.2 3.86,18.41 C4.08,18.64 4.38,18.76 4.69,18.76 L17.59,18.76 C17.9,18.76 18.2,18.64 18.41,18.41 L22.28,22.28 L0,22.28 L0,0 Z" />
          <path
            d="M0,0 L22.28,0 L22.28,22.28 L18.41,18.41 C18.64,18.2 18.76,17.9 18.76,17.59 L18.76,4.69 C18.76,4.42 18.67,4.17 18.5,3.96 L18.41,3.86 C18.2,3.64 17.9,3.52 17.59,3.52 L4.69,3.52 C4.38,3.52 4.08,3.64 3.86,3.86 L0,0 Z"
            opacity="0.5"
          />
        </g>
      </g>
    </svg>
  );
}
