"use client";

import { useEffect } from "react";

/** Fumadocs' search buttons. */
const SEARCH_TRIGGERS = "[data-search], [data-search-full]";

let searchDialog: Promise<unknown> | undefined;

/**
 * Starts loading the search dialog, the module Fumadocs' SearchProvider loads
 * when search opens. A failed load is tried again on the next call.
 */
export function preloadSearchDialog(): Promise<unknown> {
  searchDialog ??= import("fumadocs-ui/components/dialog/search-default").catch(
    () => {
      searchDialog = undefined;
    },
  );
  return searchDialog;
}

/**
 * Loads the search dialog once someone reaches for search, instead of on
 * every page (the provider's `preload: false`): when a pointer reaches a
 * search button or presses it, when one gets focus, and when ⌘ or Ctrl goes
 * down ahead of the ⌘K/Ctrl+K shortcut. The dialog's code is about 100 KB
 * compressed, and most visits never search.
 */
export function SearchPreload() {
  useEffect(() => {
    const controller = new AbortController();
    const preload = () => {
      controller.abort();
      void preloadSearchDialog();
    };
    const onTrigger = (event: Event) => {
      if (
        event.target instanceof Element &&
        event.target.closest(SEARCH_TRIGGERS)
      ) {
        preload();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) preload();
    };
    const options = { passive: true, signal: controller.signal };
    document.addEventListener("pointerover", onTrigger, options);
    document.addEventListener("pointerdown", onTrigger, options);
    document.addEventListener("focusin", onTrigger, options);
    document.addEventListener("keydown", onKeyDown, options);
    return () => controller.abort();
  }, []);

  return null;
}
