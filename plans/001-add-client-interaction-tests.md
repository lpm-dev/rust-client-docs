# 001 — Add client-component interaction tests

- **Status**: DONE
- **Commit**: bfed31a
- **Severity**: MEDIUM
- **Category**: Maintainability & architecture
- **Rule**: Beyond the scan
- **Estimated scope**: 3 files plus lockfile, about 80 lines

## Problem

`vitest.config.ts:11` runs every test in a Node environment, and every existing test lives under `tests/unit/`. The client components that own clipboard state, mobile-menu focus, PostHog navigation effects, and reveal behavior have no DOM interaction coverage.

    // vitest.config.ts:11 — current
    test: {
      include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
      environment: "node",
    },

`package.json:8` also runs only `test:unit` in the repository check:

    "check": "npm run lint && npm run types:check && npm run test:unit && npm run build",
    "test:unit": "vitest run tests/unit",

Without a browser-like harness, the medium-priority fixes in plans 002–006 cannot be regression-tested mechanically.

## Target

Install these exact current releases as dev dependencies and let npm update `package-lock.json`:

    "devDependencies": {
      "@testing-library/react": "^16.3.2",
      "@testing-library/user-event": "^14.6.1",
      "jsdom": "^29.1.1"
    }

Extend the scripts so CI runs both suites:

    "check": "npm run lint && npm run types:check && npm run test:unit && npm run test:components && npm run build",
    "test:components": "vitest run tests/components",
    "test:components:watch": "vitest tests/components",
    "test:unit": "vitest run tests/unit",

Do not change the global `environment: "node"`. Component tests opt into jsdom at file level so existing route and utility tests stay in the fast Node environment:

    /* @vitest-environment jsdom */

    import { cleanup, render, screen, waitFor } from "@testing-library/react";
    import userEvent from "@testing-library/user-event";
    import { afterEach, describe, expect, it, vi } from "vitest";
    import { CopyButton } from "../../app/(home)/_components/copy-button";

    afterEach(() => {
      cleanup();
      vi.restoreAllMocks();
    });

    describe("CopyButton", () => {
      it("writes the install command to the clipboard", async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: { writeText },
        });

        render(<CopyButton />);
        await userEvent.click(screen.getByRole("button", { name: "Copy" }));

        await waitFor(() => {
          expect(writeText).toHaveBeenCalledWith(
            "curl -fsSL https://cli.lpm.dev/install | sh",
          );
        });
      });
    });

Place that first harness test at `tests/components/copy-button.test.tsx`. Later plans extend it rather than creating competing test files.

## Repo conventions to follow

- Follow explicit Vitest imports and relative application imports from `tests/unit/home-markdown.test.ts:1`.
- Keep `vitest.config.ts`'s `@` alias and Node default unchanged.
- Keep component tests under `tests/components/` and include the jsdom environment docblock at the top of each `.test.tsx` file.
- Use Testing Library queries by accessible role and name; do not query CSS classes for interactions.

## Steps

1. Run `npm install --save-dev @testing-library/react@16.3.2 @testing-library/user-event@14.6.1 jsdom@29.1.1` so npm writes the repository's normal caret ranges and `package-lock.json` agrees.
2. Add `test:components` and `test:components:watch`, and include `test:components` in `check` after `test:unit`.
3. Create `tests/components/copy-button.test.tsx` with the exact success-path test above.
4. Run the component and unit suites separately to prove the jsdom opt-in does not change existing Node tests.
5. Re-read the diff and remove unrelated lockfile or formatting churn.

## Boundaries

- This plan is explicitly allowed to add the three listed test-only dependencies; add no production dependency.
- Do NOT change application source behavior in this plan.
- Do NOT change Vitest's default environment from Node to jsdom.
- Do NOT introduce global Testing Library setup or jest-dom matchers; native Vitest assertions are sufficient.
- STOP if the code has drifted from commit `bfed31a`; report the drift instead of improvising.

## Verification

- **Mechanical**:
  - `npm run test:components` passes.
  - `npm run test:unit` still passes in the Node environment.
  - `npm run types:check` and `npm run lint` pass.
  - `npx react-doctor@latest --scope changed` does not lower the score.
- **Behavior check**: Run the test once with a resolving clipboard mock and confirm it calls `writeText` exactly once with the install command. In a browser at `/`, click Copy once and confirm existing behavior is unchanged.
- **Done when**: the repository has an isolated jsdom component-test lane, CI/check runs it, the first interaction test passes, and existing unit tests remain unaffected.
