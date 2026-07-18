# 002 — Report clipboard results honestly

- **Status**: DONE
- **Commit**: bfed31a
- **Severity**: MEDIUM
- **Category**: Bugs & correctness
- **Rule**: Beyond the scan
- **Estimated scope**: 2 files, about 55 lines

## Problem

`app/(home)/_components/copy-button.tsx:18` starts a clipboard write but reports success immediately. Optional chaining and the empty catch suppress both an unavailable Clipboard API and a rejected write.

    // app/(home)/_components/copy-button.tsx:18 — current
    function copy() {
      // Optional chaining short-circuits the whole chain when clipboard is
      // unavailable (insecure context), so .catch never runs on undefined.
      void navigator.clipboard?.writeText(INSTALL_CMD).catch(() => {});
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), RESET_MS);
    }

Users can therefore see “Copied ✓” when permissions, browser policy, or an insecure context prevented any copy.

## Target

Replace the boolean with a small explicit state machine and update state only after the awaited result is known:

    type CopyState = "idle" | "copied" | "error";

    export function CopyButton() {
      const [copyState, setCopyState] = useState<CopyState>("idle");
      const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

      useEffect(() => {
        return () => {
          if (timer.current) clearTimeout(timer.current);
        };
      }, []);

      async function copy() {
        let nextState: CopyState = "copied";

        try {
          if (!navigator.clipboard) {
            throw new Error("Clipboard API unavailable");
          }
          await navigator.clipboard.writeText(INSTALL_CMD);
        } catch {
          nextState = "error";
        }

        setCopyState(nextState);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopyState("idle"), RESET_MS);
      }

      return (
        <button
          type="button"
          className="copybtn"
          onClick={() => void copy()}
        >
          {copyState === "copied"
            ? "Copied ✓"
            : copyState === "error"
              ? "Copy failed"
              : "Copy"}
        </button>
      );
    }

Extend `tests/components/copy-button.test.tsx` with resolving, rejecting, and unavailable clipboard cases. Use fake timers only for the reset assertion; restore real timers after each relevant test.

## Repo conventions to follow

- Preserve the existing `RESET_MS`, timer ref, unmount cleanup, and local function style in `copy-button.tsx`.
- Extend the harness from plan 001; do not create a second CopyButton test file.
- Follow explicit async assertions and mock restoration from `tests/components/copy-button.test.tsx`.
- Keep the visible labels terse and consistent with the homepage's code-first style.

## Steps

1. At `copy-button.tsx:8`, introduce `CopyState` and replace `copied` with `copyState`.
2. At `copy-button.tsx:18`, replace the fire-and-forget handler with the exact awaited target above.
3. Preserve timer cancellation on repeated clicks and unmount; reset both success and failure to idle after `RESET_MS`.
4. Update the existing success test to assert “Copied ✓” appears only after the promise resolves.
5. Add a rejected-write test that asserts “Copy failed” and never “Copied ✓”.
6. Add an unavailable-API test by defining `navigator.clipboard` as `undefined` and assert the same failure state.
7. Re-read the diff and remove unrelated churn.

## Boundaries

- Do NOT add a legacy `document.execCommand("copy")` fallback.
- Do NOT log clipboard errors or expose exception details to users.
- Do NOT change the install command.
- Do NOT add dependencies; plan 001 owns the test dependencies.
- Plan 003 will add the live-region semantics. Do not pre-empt it here.
- If plan 001 has been applied, its expected test-file drift is allowed; otherwise STOP on source drift from commit `bfed31a`.

## Verification

- **Mechanical**:
  - `npx vitest run tests/components/copy-button.test.tsx` covers success, rejection, missing API, repeated click timer replacement, and unmount cleanup.
  - `npm run types:check` and `npm run lint` pass.
  - `npx react-doctor@latest --scope changed` does not lower the score.
- **Behavior check**: At `/`, grant clipboard access and confirm the button changes to “Copied ✓” only after the command reaches the clipboard. Deny clipboard access in browser permissions and confirm it shows “Copy failed”, remains clickable, and returns to “Copy” after about 1.6 seconds.
- **Done when**: the UI never claims success for a failed or unavailable clipboard write, retry works, and all focused checks pass.
