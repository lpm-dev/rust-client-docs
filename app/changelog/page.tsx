import type { Metadata } from 'next';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';

export const metadata: Metadata = {
  title: 'Changelog',
  description: 'Release notes for the LPM Rust client.',
};

export default function ChangelogPage() {
  return (
    <HomeLayout {...baseOptions()}>
      <main className="container mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Changelog</h1>
        <p className="text-fd-muted-foreground mb-10">
          Release notes for the LPM Rust client.
        </p>
        <div className="prose dark:prose-invert">
          <p>Release notes coming soon. In the meantime, see the GitHub releases:</p>
          <p>
            <a
              href="https://github.com/lpm-dev/rust-client/releases"
              className="underline"
            >
              github.com/lpm-dev/rust-client/releases
            </a>
          </p>
        </div>
      </main>
    </HomeLayout>
  );
}
