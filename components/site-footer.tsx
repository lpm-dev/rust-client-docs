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
          d="M32.3937931,4.16206897 L28.137931,5.86206897 L29.837931,1.6062069 C29.9814535,1.24584586 29.9374509,0.837823838 29.7203966,0.516348779 C29.5033423,0.194873726 29.1413353,0.00156262241 28.7534483,0 L5.24655172,0 C4.85866469,0.00156262241 4.49665776,0.194873726 4.27960343,0.516348779 C4.06254911,0.837823838 4.01854645,1.24584586 4.16206897,1.6062069 L5.86206897,5.86206897 L1.6062069,4.16206897 C1.24584586,4.01854645 0.837823838,4.06254911 0.516348779,4.27960343 C0.194873726,4.49665776 0.00156262241,4.85866469 0,5.24655172 L0,28.7534483 C0.00156262241,29.1413353 0.194873726,29.5033423 0.516348779,29.7203966 C0.837823838,29.9374509 1.24584586,29.9814535 1.6062069,29.837931 L5.86206897,28.137931 L4.16206897,32.3937931 C4.01854645,32.7541541 4.06254911,33.1621762 4.27960343,33.4836512 C4.49665776,33.8051263 4.85866469,33.9984373 5.24655172,34 L28.7534483,34 C29.1413353,33.9984373 29.5033423,33.8051263 29.7203966,33.4836512 C29.9374509,33.1621762 29.9814535,32.7541541 29.837931,32.3937931 L28.137931,28.137931 L32.3937931,29.837931 C32.7541541,29.9814535 33.1621762,29.9374509 33.4836512,29.7203966 C33.8051263,29.5033423 33.9984373,29.1413353 34,28.7534483 L34,5.24655172 C33.9984373,4.85866469 33.8051263,4.49665776 33.4836512,4.27960343 C33.1621762,4.06254911 32.7541541,4.01854645 32.3937931,4.16206897 Z"
          fill={color}
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
