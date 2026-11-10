"use client";

import { useMediaQuery } from "fumadocs-core/utils/use-media-query";
import {
  Sidebar,
  SidebarProvider,
  type SidebarProviderProps,
  SidebarTrigger,
  useSidebar,
} from "fumadocs-ui/layouts/docs/slots/sidebar";
import { useEffect, useState } from "react";

/** Below this width Fumadocs' sidebar is a drawer (its `mode: "drawer"`). */
const DRAWER_QUERY = "(width < 768px)";

/**
 * Fumadocs' sidebar provider, with prefetching held back while the sidebar's
 * links can't be seen. Below 768 px the sidebar is a drawer, and a closed
 * drawer stays laid out at `visibility: hidden`. Next prefetches every link in
 * the viewport whether it's visible or not, so a phone fetched each page in
 * the section, about 150 KB, on every docs page. The drawer's links now
 * prefetch when it opens, before they can be tapped. Until the media query
 * has run, the provider can't tell a phone from a desktop, so it waits.
 */
function DocsSidebarProvider({
  prefetch,
  children,
  ...props
}: SidebarProviderProps) {
  const [linksShown, setLinksShown] = useState(false);

  return (
    <SidebarProvider {...props} prefetch={linksShown ? prefetch : false}>
      <SidebarLinksShown onChange={setLinksShown} />
      {children}
    </SidebarProvider>
  );
}

function SidebarLinksShown({
  onChange,
}: {
  onChange: (shown: boolean) => void;
}) {
  const { open } = useSidebar();
  const drawer = useMediaQuery(DRAWER_QUERY);
  const shown = drawer === false || (drawer === true && open);

  useEffect(() => onChange(shown), [onChange, shown]);
  return null;
}

/** The docs layout's sidebar slot: Fumadocs' own, with the provider above. */
export const docsSidebarSlot = {
  provider: DocsSidebarProvider,
  root: Sidebar,
  trigger: SidebarTrigger,
  useSidebar,
};
