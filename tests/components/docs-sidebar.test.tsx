/* @vitest-environment jsdom */

import { act, cleanup, render, screen } from "@testing-library/react";
import { FrameworkProvider } from "fumadocs-core/framework";
import { useSidebar } from "fumadocs-ui/layouts/docs/slots/sidebar";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { docsSidebarSlot } from "@/components/docs-sidebar";

const DocsSidebarProvider = docsSidebarSlot.provider;

/** A matchMedia whose `(width < 768px)` answer the test sets. */
const viewport = {
  phone: false,
  listeners: new Set<() => void>(),
  resize(phone: boolean) {
    viewport.phone = phone;
    for (const listener of viewport.listeners) listener();
  },
};

beforeEach(() => {
  viewport.phone = false;
  viewport.listeners.clear();
  window.matchMedia = ((query: string) => ({
    get matches() {
      return query === "(width < 768px)" && viewport.phone;
    },
    media: query,
    addEventListener: (_type: string, listener: () => void) =>
      viewport.listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) =>
      viewport.listeners.delete(listener),
  })) as unknown as typeof window.matchMedia;
});

afterEach(cleanup);

function Framework({ children }: { children: ReactNode }) {
  return (
    <FrameworkProvider
      usePathname={() => "/docs/packages/install"}
      useParams={() => ({})}
      useRouter={() => ({ push: () => {}, refresh: () => {} })}
    >
      {children}
    </FrameworkProvider>
  );
}

let setOpen: (open: boolean) => void = () => {};

/** Shows the `prefetch` the sidebar's links get. */
function SidebarLinksPrefetch() {
  const sidebar = useSidebar() as ReturnType<typeof useSidebar> & {
    prefetch?: boolean;
  };
  setOpen = sidebar.setOpen;
  return <output>{String(sidebar.prefetch)}</output>;
}

function sidebar(prefetch?: boolean) {
  return (
    <Framework>
      <DocsSidebarProvider prefetch={prefetch}>
        <SidebarLinksPrefetch />
      </DocsSidebarProvider>
    </Framework>
  );
}

const linksPrefetch = () => screen.getByRole("status").textContent;

describe("the docs sidebar provider", () => {
  it("renders the links without prefetching on the server, before it knows the width", () => {
    expect(renderToString(sidebar())).toContain("<output>false</output>");
  });

  it("leaves a desktop's sidebar links to Next's default prefetching", () => {
    render(sidebar());

    expect(linksPrefetch()).toBe("undefined");
  });

  it("keeps a phone's closed drawer from prefetching, and prefetches when it opens", () => {
    viewport.phone = true;
    render(sidebar());
    expect(linksPrefetch()).toBe("false");

    act(() => setOpen(true));
    expect(linksPrefetch()).toBe("undefined");

    act(() => setOpen(false));
    expect(linksPrefetch()).toBe("false");
  });

  it("follows the width when the window crosses the drawer breakpoint", () => {
    render(sidebar());
    expect(linksPrefetch()).toBe("undefined");

    act(() => viewport.resize(true));
    expect(linksPrefetch()).toBe("false");
  });

  it("keeps a layout's own prefetch setting where the links show", () => {
    render(sidebar(false));

    expect(linksPrefetch()).toBe("false");
  });
});
