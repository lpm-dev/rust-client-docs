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
        setMenuOpen(false);
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
        </Link>

        <nav className="hidden min-[890px]:flex items-center gap-1 flex-1">
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
            className="h-8 min-w-[11rem] rounded-lg text-xs"
          />
          <ThemeSwitch />
          <div ref={menuRef} className="relative">
            <button
              type="button"
              aria-label={menuOpen ? "Close section menu" : "Open section menu"}
              aria-haspopup="true"
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
              className="hidden min-[890px]:inline-flex items-center justify-center size-9 rounded-md text-fd-muted-foreground hover:text-fd-foreground hover:bg-fd-muted/50 transition-colors"
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
          d="M32.3937931,4.16206897 L28.137931,5.86206897 L29.837931,1.6062069 C29.9814535,1.24584586 29.9374509,0.837823838 29.7203966,0.516348779 C29.5033423,0.194873726 29.1413353,0.00156262241 28.7534483,0 L5.24655172,0 C4.85866469,0.00156262241 4.49665776,0.194873726 4.27960343,0.516348779 C4.06254911,0.837823838 4.01854645,1.24584586 4.16206897,1.6062069 L5.86206897,5.86206897 L1.6062069,4.16206897 C1.24584586,4.01854645 0.837823838,4.06254911 0.516348779,4.27960343 C0.194873726,4.49665776 0.00156262241,4.85866469 0,5.24655172 L0,28.7534483 C0.00156262241,29.1413353 0.194873726,29.5033423 0.516348779,29.7203966 C0.837823838,29.9374509 1.24584586,29.9814535 1.6062069,29.837931 L5.86206897,28.137931 L4.16206897,32.3937931 C4.01854645,32.7541541 4.06254911,33.1621762 4.27960343,33.4836512 C4.49665776,33.8051263 4.85866469,33.9984373 5.24655172,34 L28.7534483,34 C29.1413353,33.9984373 29.5033423,33.8051263 29.7203966,33.4836512 C29.9374509,33.1621762 29.9814535,32.7541541 29.837931,32.3937931 L28.137931,28.137931 L32.3937931,29.837931 C32.7541541,29.9814535 33.1621762,29.9374509 33.4836512,29.7203966 C33.8051263,29.5033423 33.9984373,29.1413353 34,28.7534483 L34,5.24655172 C33.9984373,4.85866469 33.8051263,4.49665776 33.4836512,4.27960343 C33.1621762,4.06254911 32.7541541,4.01854645 32.3937931,4.16206897 Z"
          fill="#2376E3"
        />
        <g transform="translate(5.8621, 5.8621)" fill="#FFFFFF">
          <path d="M0,0 L3.86310345,3.86310345 C3.64042754,4.08027036 3.51558646,4.37861936 3.51724138,4.68965517 L3.51724138,17.5862069 C3.51558646,17.8972427 3.64042754,18.1955917 3.86310345,18.4127586 C4.08027036,18.6354345 4.37861936,18.7602756 4.68965517,18.7586207 L17.5862069,18.7586207 C17.8972427,18.7602756 18.1955917,18.6354345 18.4127586,18.4127586 L22.2758621,22.2758621 L0,22.2758621 L0,0 Z" />
          <path
            d="M0,0 L22.2758621,0 L22.2758621,22.2758621 L18.4127586,18.4127586 C18.6354345,18.1955917 18.7602756,17.8972427 18.7586207,17.5862069 L18.7586207,4.68965517 C18.7600392,4.42305305 18.6685219,4.16577185 18.5021177,3.96094562 L18.4127586,3.86310345 C18.1955917,3.64042754 17.8972427,3.51558646 17.5862069,3.51724138 L4.68965517,3.51724138 C4.37861936,3.51558646 4.08027036,3.64042754 3.86310345,3.86310345 L0,0 Z"
            opacity="0.5"
          />
        </g>
      </g>
    </svg>
  );
}
