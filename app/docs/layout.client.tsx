"use client";

import type { CSSProperties, ReactNode } from "react";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { SidebarTabsDropdown } from "fumadocs-ui/components/sidebar/tabs/dropdown";
import { getLayoutTabs, isLayoutTabActive } from "fumadocs-ui/layouts/shared";
import type * as PageTree from "fumadocs-core/page-tree";
import { baseOptions } from "@/lib/layout.shared";

const docsContainerStyle: CSSProperties = {
	"--fd-docs-row-1": "var(--site-header-height)",
	minHeight: "calc(100dvh - var(--site-header-height))",
} as CSSProperties;

export function DocsLayoutClient({
	tree,
	children,
}: {
	tree: PageTree.Root;
	children: ReactNode;
}) {
	const pathname = usePathname() ?? "";

	const tabs = useMemo(() => getLayoutTabs(tree), [tree]);

	const scopedTree = useMemo<PageTree.Root>(() => {
		const activeTab = tabs.findLast((t) => {
			if (isLayoutTabActive(t, pathname)) return true;
			if (!t.url) return false;
			return pathname === t.url || pathname.startsWith(`${t.url}/`);
		});
		const activeFolder = activeTab?.$folder;

		if (activeFolder) {
			// Inside a capability section: show only that section's children,
			// stripping the index page entry (the capability dropdown already
			// represents the section, so the index would be a duplicate "title").
			const indexUrl = activeTab?.url;
			const children = activeFolder.children.filter(
				(node) => !(node.type === "page" && node.url === indexUrl),
			);
			// A unique $id per scope is required — Fumadocs' TreeContextProvider
			// memoizes on tree.$id, so without a distinct id the old children
			// are served from cache after client-side navigation.
			return {
				...tree,
				$id: `scope:${activeTab?.url ?? "section"}`,
				children,
			} as PageTree.Root;
		}

		// On /docs root or a top-level page: show top-level non-root items
		// (Installation, First install, etc.), hide the capability roots since
		// the top-nav + dropdown handle cross-section navigation.
		return {
			...tree,
			$id: "scope:root",
			children: tree.children.filter(
				(node) => !(node.type === "folder" && node.root),
			),
		} as PageTree.Root;
	}, [tree, tabs, pathname]);

	return (
		<DocsLayout
			tree={scopedTree}
			{...baseOptions()}
			nav={{
				...baseOptions().nav,
				children: (
					<SidebarTabsDropdown options={tabs} className="flex-1" />
				),
			}}
			containerProps={{ style: docsContainerStyle }}
		>
			{children}
		</DocsLayout>
	);
}
