"use client";

import { FullSearchTrigger } from "fumadocs-ui/layouts/shared/slots/search-trigger";
import { ThemeSwitch } from "fumadocs-ui/layouts/shared/slots/theme-switch";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const githubHref = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;
  const activeNavItem = pickActiveItem(pathname, NAV_ITEMS);
  const activeTrailingItem = pickActiveItem(pathname, TRAILING_ITEMS);

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

        <nav className="hidden md:flex items-center gap-1 flex-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={item === activeNavItem}
            />
          ))}
        </nav>

        <div className="flex-1 md:hidden" />

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
          <a
            href={githubHref}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="inline-flex items-center justify-center size-9 rounded-md text-fd-muted-foreground hover:text-fd-foreground hover:bg-fd-muted/50 transition-colors"
          >
            <GitHubIcon />
          </a>
        </div>
      </div>
    </header>
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

function GitHubIcon() {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="size-4"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}
