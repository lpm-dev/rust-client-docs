import Link from "next/link";
import { homeJsonLd, safeJsonLd } from "@/lib/seo";
import { appName, appTagline } from "@/lib/shared";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center flex-1 px-6 py-24 text-center">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD payload is escaped by safeJsonLd
        dangerouslySetInnerHTML={safeJsonLd(homeJsonLd())}
      />
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
        {appName}
      </h1>
      <p className="text-lg sm:text-xl text-fd-muted-foreground max-w-2xl mb-10">
        {appTagline}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/docs"
          className="inline-flex items-center rounded-md bg-fd-primary text-fd-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90 transition"
        >
          Get Started
        </Link>
        <Link
          href="/docs/commands"
          className="inline-flex items-center rounded-md border border-fd-border px-5 py-2.5 text-sm font-medium hover:bg-fd-muted transition"
        >
          Commands
        </Link>
      </div>
    </main>
  );
}
