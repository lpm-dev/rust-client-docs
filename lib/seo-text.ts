const SEO_TITLE_MIN_LENGTH = 25;
const SEO_TITLE_MAX_LENGTH = 65;
const SEO_TITLE_SUFFIX = " | LPM CLI";

function isCommandPage(title: string): boolean {
  return /^(?:lpm|lpx)(?:\s|$)/.test(title);
}

function pickSeoTitle(candidates: string[]): string {
  const inRange = candidates.find(
    (candidate) =>
      candidate.length >= SEO_TITLE_MIN_LENGTH &&
      candidate.length <= SEO_TITLE_MAX_LENGTH,
  );

  if (inRange) return inRange;

  return candidates
    .map((candidate) => ({
      candidate,
      distance: Math.abs(
        candidate.length - (SEO_TITLE_MIN_LENGTH + SEO_TITLE_MAX_LENGTH) / 2,
      ),
    }))
    .sort((a, b) => a.distance - b.distance)[0].candidate;
}

export function resolvedDocsTitle(title: string, slugs: string[]): string {
  const key = slugs.join("/");
  const section = slugs[0];
  const titleOverrides: Record<string, string> = {
    "": `LPM CLI docs: package manager and dev toolkit`,
    commands: `LPM command cheat sheet${SEO_TITLE_SUFFIX}`,
    comparison: `LPM vs npm, pnpm, and bun | package manager defaults`,
    "first-install": `First LPM install walkthrough${SEO_TITLE_SUFFIX}`,
    installation: `Install LPM CLI | npm, Homebrew, curl, cargo`,
    "lpm-dev-and-pro": `lpm.dev and Pro features${SEO_TITLE_SUFFIX}`,
    migrating: `Migrate npm, pnpm, yarn, or bun to LPM CLI`,
    "project-setup": `Project setup with package.json and lpm.json${SEO_TITLE_SUFFIX}`,
    registries: `Registry routing with npm and lpm.dev${SEO_TITLE_SUFFIX}`,
    dev: `Developer workflow docs${SEO_TITLE_SUFFIX}`,
    guides: `LPM workflow guides${SEO_TITLE_SUFFIX}`,
    infra: `Infrastructure command docs${SEO_TITLE_SUFFIX}`,
    packages: `Package management docs${SEO_TITLE_SUFFIX}`,
    reference: `LPM config and file reference${SEO_TITLE_SUFFIX}`,
  };
  const candidates = [
    ...(titleOverrides[key] ? [titleOverrides[key]] : []),
    ...(isCommandPage(title)
      ? [`${title} command reference${SEO_TITLE_SUFFIX}`]
      : []),
    ...(section === "reference"
      ? [`${title} reference${SEO_TITLE_SUFFIX}`]
      : []),
    ...(section === "guides" ? [`${title} guide${SEO_TITLE_SUFFIX}`] : []),
    ...(section === "packages" ? [`${title} | LPM package docs`] : []),
    ...(section === "dev" ? [`${title} | LPM dev docs`] : []),
    ...(section === "infra" ? [`${title} | LPM infrastructure docs`] : []),
    `${title}${SEO_TITLE_SUFFIX}`,
  ];

  return pickSeoTitle(candidates);
}

export function resolvedDocsDescription(description: string): string {
  return description
    .replace(/`|\*|#/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
