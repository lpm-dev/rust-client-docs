import Link from "next/link";
import type { ReactNode } from "react";
import { FOOTER } from "@/lib/home-content";

function FooterLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  if (href.startsWith("http")) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function LpmMark({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 36 36" aria-hidden="true" className="size-7 shrink-0">
      <g transform="translate(1, 1)">
        <path
          d="M32.39,4.16 L28.14,5.86 L29.84,1.61 C29.98,1.25 29.94,0.84 29.72,0.52 C29.5,0.19 29.14,0 28.75,0 L5.25,0 C4.86,0 4.5,0.19 4.28,0.52 C4.06,0.84 4.02,1.25 4.16,1.61 L5.86,5.86 L1.61,4.16 C1.25,4.02 0.84,4.06 0.52,4.28 C0.19,4.5 0,4.86 0,5.25 L0,28.75 C0,29.14 0.19,29.5 0.52,29.72 C0.84,29.94 1.25,29.98 1.61,29.84 L5.86,28.14 L4.16,32.39 C4.02,32.75 4.06,33.16 4.28,33.48 C4.5,33.81 4.86,34 5.25,34 L28.75,34 C29.14,34 29.5,33.81 29.72,33.48 C29.94,33.16 29.98,32.75 29.84,32.39 L28.14,28.14 L32.39,29.84 C32.75,29.98 33.16,29.94 33.48,29.72 C33.81,29.5 34,29.14 34,28.75 L34,5.25 C34,4.86 33.81,4.5 33.48,4.28 C33.16,4.06 32.75,4.02 32.39,4.16 Z"
          fill={color}
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

function GitHubMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-7 shrink-0"
      fill="currentColor"
    >
      <path d="M12 .5C5.65 .5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.92.58.11.79-.25.79-.56 0-.27-.01-1.16-.02-2.1-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18.92-.26 1.9-.38 2.88-.39.98 0 1.96.13 2.88.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.41-5.27 5.69.42.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.67.8.56C20.71 21.39 24 17.08 24 12 24 5.65 18.85.5 12 .5Z" />
    </svg>
  );
}

function XMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-7 shrink-0"
      fill="currentColor"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817-5.967 6.817H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

function FooterIcon({ label }: { label: string }) {
  switch (label) {
    case "LPM.dev Registry":
      return <LpmMark color="#1D9F4F" />;
    case "LPM Firewall":
      return <LpmMark color="#F2270C" />;
    case "GitHub":
      return <GitHubMark />;
    case "X/LPM_dev_":
      return <XMark />;
    default:
      return null;
  }
}

export function SiteFooter() {
  return (
    <footer className="border-t border-fd-border bg-fd-background">
      <div className="mx-auto w-full max-w-[1340px] px-8 pt-20">
        <div className="mb-[70px] grid grid-cols-1 gap-x-8 gap-y-10 text-left sm:grid-cols-2 lg:grid-cols-5">
          {FOOTER.map((column) => (
            <div key={column.heading}>
              <h4 className="mb-[18px] text-[11px] tracking-[0.14em] text-fd-muted-foreground uppercase">
                {column.heading}
              </h4>
              {column.links.map((item) => {
                const icon =
                  column.heading === "LPM" ? (
                    <FooterIcon label={item.label} />
                  ) : null;

                return (
                  <FooterLink
                    key={item.label}
                    href={item.href}
                    className={
                      icon
                        ? "mb-2.5 flex items-center gap-[9px] text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground"
                        : "mb-2.5 block text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground"
                    }
                  >
                    {icon}
                    <span>{item.label}</span>
                  </FooterLink>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1340px] px-8">
        <div className="flex flex-wrap justify-between gap-3.5 py-6 pb-10 text-xs text-fd-muted-foreground">
          <span>© 2026 lpm.dev</span>
          <span>The fast, all-in-one toolkit for modern software.</span>
        </div>
      </div>
    </footer>
  );
}
