# 003 — Announce copy status accessibly

- **Status**: DONE
- **Commit**: bfed31a
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Rule**: Beyond the scan
- **Estimated scope**: 2 files, about 35 lines

## Problem

`app/(home)/_components/copy-button.tsx:27` uses the changing visible text as the button's only accessible name:

    // app/(home)/_components/copy-button.tsx:27 — current at audit commit
    return (
      <button type="button" className="copybtn" onClick={copy}>
        {copied ? "Copied ✓" : "Copy"}
      </button>
    );

The original name “Copy” is vague outside its visual context, and changing a focused button's text is not a reliable status announcement across screen readers. After plan 002, failure feedback also needs an announcement without making the control's accessible name unstable.

## Target

Preserve plan 002's `copyState` and async handler, then return this exact fragment:

    const statusMessage =
      copyState === "copied"
        ? "Install command copied to clipboard."
        : copyState === "error"
          ? "Could not copy the install command. Select it and copy it manually."
          : "";

    return (
      <>
        <button
          type="button"
          className="copybtn"
          aria-label="Copy install command"
          onClick={() => void copy()}
        >
          {copyState === "copied"
            ? "Copied ✓"
            : copyState === "error"
              ? "Copy failed"
              : "Copy"}
        </button>
        <span className="sr-only" role="status" aria-live="polite">
          {statusMessage}
        </span>
      </>
    );

The fragment avoids introducing a new layout wrapper inside `.copybox`; Tailwind's `sr-only` utility keeps the status available to assistive technology without occupying flex space.

## Repo conventions to follow

- Preserve plan 002's state names, retry behavior, and visible labels.
- Follow existing explicit ARIA labels such as `components/site-header.tsx:141`.
- Use the existing Tailwind utility system; do not add custom visually-hidden CSS.
- Extend `tests/components/copy-button.test.tsx` from plans 001–002.

## Steps

1. Compute `statusMessage` immediately before the component return.
2. Add the stable `aria-label="Copy install command"` to the button.
3. Return the button and status span in a fragment with the exact live-region text above.
4. Update every CopyButton test query to use the stable accessible name `Copy install command`.
5. Assert the status role is initially empty, announces the success sentence after a resolved write, and announces the manual-copy guidance after failure.
6. Verify the visible button labels from plan 002 remain unchanged.

## Boundaries

- Do NOT move focus after copy or failure.
- Do NOT use `role="alert"`; clipboard feedback is non-urgent and must remain polite.
- Do NOT put the changing result text into the button's accessible name.
- Do NOT add a wrapper that changes `.copybox` layout.
- Do NOT add dependencies.
- Expected changes from plans 001–002 are allowed; STOP if unrelated code has drifted from commit `bfed31a`.

## Verification

- **Mechanical**:
  - `npx vitest run tests/components/copy-button.test.tsx` verifies the stable name and both live announcements.
  - `npm run types:check` and `npm run lint` pass.
  - `npx react-doctor@latest --scope changed` does not lower the score.
- **Behavior check**: At `/`, navigate to the copy button using only the keyboard. Confirm its screen-reader name remains “Copy install command” before and after activation, while success or failure is announced once through the polite status region. Confirm the visible layout is unchanged at desktop and 375px widths.
- **Done when**: the control has a stable contextual name, both outcomes are announced without stealing focus, and the copybox layout does not move.
