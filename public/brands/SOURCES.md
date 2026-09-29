# Package manager logos

These logos identify the products in documentation tables. They remain the marks of their respective owners.

The copied SVGs mark their artwork as decorative because each table row includes the product name. The Yarn copy omits the XML declaration.

- Bun: existing `bun.svg` asset.
- Deno: [official repository](https://github.com/denoland/deno/blob/1b48a20f85a8164aebe4fb29ae53909136a3d777/cli/tools/jupyter/resources/deno-logo-svg.svg).
- Nub: [official website source](https://github.com/nubjs/nub/blob/5fafc73205a6f4794196aca1b4c63fe62a2a7ce2/site/public/icon.svg).
- vlt: [official docs favicon](https://github.com/vltpkg/vltpkg/blob/e27fec1277bdc57671fb9429d24b9ac0ab362ad8/www/docs/src/app/icon0.svg). The local copy adds a root viewBox for small image sizes. The upstream SVG embeds raster artwork.
- Yarn: [official website source](https://github.com/yarnpkg/berry/blob/e4e423a1eb117b5129f20ac626a03eb7a97aedff/packages/docusaurus/static/img/yarn-favicon.svg).
- UPM: [official repository](https://github.com/unjs/upm/blob/16ad722f616e5ddb7b55f67440d75b4d1a1c2c09/.github/logo.svg). The inline icon preserves the path and uses the page text color.

LPM CLI, npm, pnpm, and UPM use inline SVG components in `components/brand-icons.tsx`.
