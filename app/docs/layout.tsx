import { source } from '@/lib/source';
import { DocsLayoutClient } from './layout.client';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  const tree = source.getPageTree();

  return (
    <div data-site-layout="docs" className="flex-1 flex flex-col">
      <DocsLayoutClient tree={tree}>{children}</DocsLayoutClient>
    </div>
  );
}
