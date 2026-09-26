import { ArrowUpRight } from "lucide-react";

export function NpmPackageCard({
  name,
  description,
  href,
}: {
  name: string;
  description: string;
  href: `https://www.npmjs.com/package/${string}`;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Visit ${name} on npm (opens in a new tab)`}
      className="not-prose group my-6 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 rounded-2xl border border-fd-border bg-fd-card p-4 text-fd-card-foreground transition-colors hover:bg-fd-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fd-ring sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:p-5"
    >
      <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-fd-background">
        <svg
          viewBox="0 0 18 7"
          aria-hidden="true"
          className="w-9 text-[#cb3837] dark:text-[#ef6b6b]"
          fill="currentColor"
        >
          <path d="M0 0v6h5v1h4V6h9V0H0zm5 5H4V2H3v3H1V1h4v4zm5 0H8v1H6V1h4v4zm7 0h-1V2h-1v3h-1V2h-1v3h-2V1h6v4zM8 2h1v2H8V2z" />
        </svg>
      </span>
      <span className="min-w-0">
        <span className="block text-base font-semibold [overflow-wrap:anywhere]">
          {name}
        </span>
        <span className="mt-1 block text-sm leading-relaxed text-fd-muted-foreground">
          {description}
        </span>
      </span>
      <span className="col-start-2 inline-flex items-center gap-1.5 justify-self-start rounded-lg border border-fd-border px-3 py-1.5 text-sm font-medium transition-colors group-hover:bg-fd-background sm:col-start-auto">
        Visit
        <ArrowUpRight aria-hidden="true" className="size-4" />
      </span>
    </a>
  );
}
