# 006 — Make scroll reveals progressive-enhancement-safe

- **Status**: DONE
- **Commit**: bfed31a
- **Severity**: LOW
- **Category**: Bugs & correctness
- **Rule**: Beyond the scan
- **Estimated scope**: 3 files, about 85 lines

## Problem

`app/(home)/home.css:355` hides every `.reveal` element by default:

    // app/(home)/home.css:355 — current
    .home-root .reveal {
      opacity: 0;
      transform: translateY(24px);
      transition:
        opacity 0.8s cubic-bezier(0.2, 0.8, 0.2, 1),
        transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    .home-root .reveal.in {
      opacity: 1;
      transform: none;
    }

`app/(home)/_components/reveal.tsx:18` adds `.in` only from a hydrated effect and assumes `IntersectionObserver` exists. When JavaScript fails, hydration is blocked, or the API is unavailable, section headings and the install call-to-action remain invisible despite being present in server HTML.

## Target

Make visible content the CSS default. Opt into the hidden pre-reveal state only after client capability checks succeed:

    export function Reveal({ as = "div", id, className, children }: RevealProps) {
      const [node, setNode] = useState<HTMLElement | null>(null);
      const [revealPending, setRevealPending] = useState(false);
      const [inView, setInView] = useState(false);

      useEffect(() => {
        if (!node) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          return;
        }
        if (typeof IntersectionObserver === "undefined") {
          return;
        }

        const observer = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting) {
                setRevealPending(false);
                setInView(true);
                observer.disconnect();
                break;
              }
            }
          },
          { rootMargin: "0px 0px -10% 0px", threshold: 0.01 },
        );

        observer.observe(node);
        setRevealPending(true);
        return () => observer.disconnect();
      }, [node]);

      const classes = cn(
        "reveal",
        revealPending && "reveal-pending",
        inView && "in",
        className,
      );

Use this exact CSS state model:

    .home-root .reveal {
      opacity: 1;
      transform: none;
      transition:
        opacity 0.8s cubic-bezier(0.2, 0.8, 0.2, 1),
        transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    .home-root .reveal.reveal-pending {
      opacity: 0;
      transform: translateY(24px);
    }
    .home-root .reveal.in {
      opacity: 1;
      transform: none;
    }

The existing reduced-motion media query remains as a final override.

## Repo conventions to follow

- Preserve the current callback ref and `cn` class composition.
- Preserve the observer threshold/root margin and disconnect-after-first-entry behavior.
- Keep reduced-motion handling aligned between the effect and `home.css:367`.
- Add focused coverage under `tests/components/reveal.test.tsx` using plan 001's jsdom lane.

## Steps

1. Add `revealPending` state and the explicit `IntersectionObserver` availability guard.
2. Construct and observe successfully before setting `revealPending` true.
3. Clear pending and set in-view together when the element intersects.
4. Update the composed class list with `reveal-pending`.
5. Change CSS so `.reveal` is visible by default and only `.reveal.reveal-pending` is hidden/transformed.
6. Add tests for missing `IntersectionObserver`, reduced motion, a non-intersecting observer, and the transition to `.in` after intersection.
7. Server-render the component in a test and assert the initial HTML does not contain `reveal-pending` and is not dependent on `.in` for visibility.

## Boundaries

- Do NOT replace the effect with scroll listeners.
- Do NOT hide content before the observer has been created and attached.
- Do NOT change animation duration, easing, root margin, threshold, or visible layout.
- Do NOT remove the reduced-motion CSS override.
- Do NOT add dependencies beyond plan 001.
- Expected test-harness drift from plan 001 is allowed; STOP on unrelated source drift from commit `bfed31a`.

## Verification

- **Mechanical**:
  - `npx vitest run tests/components/reveal.test.tsx` passes server-render, unsupported API, reduced motion, and intersection cases.
  - `npm run types:check` and `npm run lint` pass.
  - `npx react-doctor@latest --scope changed` does not lower the score.
- **Behavior check**: Load `/` normally and confirm the existing reveal motion still plays once. Emulate reduced motion and confirm everything is immediately visible. Disable JavaScript, reload, and confirm every section heading plus the install call-to-action remains visible. Use React DevTools “Highlight updates” to confirm each Reveal component updates only when it attaches and when it first intersects.
- **Done when**: server-rendered content is visible without JavaScript or IntersectionObserver, supported browsers retain the reveal effect, reduced motion remains immediate, and no repeated observer updates occur.
