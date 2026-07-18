# 004 — Fix mobile-menu focus and disclosure semantics

- **Status**: DONE
- **Commit**: bfed31a
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Rule**: Beyond the scan
- **Estimated scope**: 2 files, about 70 lines

## Problem

`components/site-header.tsx:78` closes the mobile section menu on Escape but does not restore focus. If focus is on one of the menu links, closing unmounts the focused element and leaves keyboard users without a predictable focus location.

    // components/site-header.tsx:78 — current
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

The trigger at `components/site-header.tsx:139` also sets `aria-haspopup="true"`. ARIA defines `true` as a menu popup, but the controlled element is correctly rendered as a navigation disclosure with ordinary links, not a `role="menu"` widget.

    <button
      type="button"
      aria-label={menuOpen ? "Close section menu" : "Open section menu"}
      aria-haspopup="true"
      aria-expanded={menuOpen}
      aria-controls="site-section-menu"

## Target

Add a trigger ref next to `menuRef`, restore focus when Escape dismisses the disclosure, and remove `aria-haspopup`:

    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const previousPathnameRef = useRef(pathname);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    <button
      ref={menuButtonRef}
      type="button"
      aria-label={menuOpen ? "Close section menu" : "Open section menu"}
      aria-expanded={menuOpen}
      aria-controls="site-section-menu"
      onClick={() => setMenuOpen((open) => !open)}
      className="inline-flex items-center justify-center size-9 rounded-md text-fd-muted-foreground hover:text-fd-foreground hover:bg-fd-muted/50 transition-colors min-[890px]:hidden"
    >

Keep the controlled element as `<nav id="site-section-menu" aria-label="Section navigation">`; do not convert it into ARIA menu roles.

## Repo conventions to follow

- Keep refs local to `SiteHeader` with explicit DOM element types, matching `menuRef` at `site-header.tsx:57`.
- Preserve the existing document-level pointer and key listener setup/cleanup.
- Preserve native `<nav>` and `<Link>` semantics.
- In the component test, mock only `usePathname`, Fumadocs search, and theme controls; keep native links and buttons real.

## Steps

1. Add `menuButtonRef` beside `menuRef` and attach it to the mobile trigger.
2. In the Escape branch, call `preventDefault`, close the disclosure, and focus the trigger.
3. Remove `aria-haspopup="true"`; preserve `aria-expanded` and `aria-controls`.
4. Create `tests/components/site-header.test.tsx` with the jsdom docblock from plan 001.
5. Mock `usePathname` to return `/docs`, and replace `FullSearchTrigger` and `ThemeSwitch` with null-rendering test stubs.
6. Test opening the disclosure, focusing the “Packages” link, pressing Escape, and asserting `document.activeElement` is the “Open section menu” trigger after it closes.
7. Assert the trigger has `aria-expanded="false"`, controls `site-section-menu`, and has no `aria-haspopup` attribute.
8. Test outside pointer dismissal separately and confirm it closes without stealing focus from the element the user clicked.

## Boundaries

- Do NOT add `role="menu"`, `role="menuitem"`, arrow-key roving focus, or a focus trap; this control is a disclosure navigation, not an application menu or modal.
- Do NOT autofocus the first link when the menu opens.
- Do NOT return focus for pointer-outside dismissal or route navigation; focus restoration is specifically for Escape dismissal.
- Do NOT change desktop navigation or the 890px breakpoint.
- Do NOT add dependencies; plan 001 owns test infrastructure.
- Expected test-harness drift from plan 001 is allowed; STOP on unrelated source drift from commit `bfed31a`.

## Verification

- **Mechanical**:
  - `npx vitest run tests/components/site-header.test.tsx` passes the Escape, ARIA, and pointer-dismissal cases.
  - `npm run types:check` and `npm run lint` pass.
  - `npx react-doctor@latest --scope changed` does not lower the score.
- **Behavior check**: At a viewport below 890px, open the section menu using Enter, Tab to a link, and press Escape. Confirm the menu disappears, focus visibly returns to the trigger, Tab continues from the trigger, and a screen reader announces a collapsed navigation control rather than a menu popup.
- **Done when**: Escape dismissal reliably restores focus, disclosure semantics match the rendered navigation, pointer dismissal remains natural, and desktop behavior is unchanged.
