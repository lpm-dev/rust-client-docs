import { ArrowUpRight } from "lucide-react";
import { NpmIcon } from "@/components/brand-icons";

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
        <NpmIcon className="w-9" />
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
