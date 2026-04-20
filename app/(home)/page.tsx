import Link from 'next/link';
import { appName, appTagline } from '@/lib/shared';

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center flex-1 px-6 py-24 text-center">
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
      <p className="mt-12 text-sm text-fd-muted-foreground">
        Landing content coming soon — benchmarks, feature cards, and the{' '}
        <code className="px-1.5 py-0.5 rounded bg-fd-muted">lpm dev</code> demo.
      </p>
    </main>
  );
}
