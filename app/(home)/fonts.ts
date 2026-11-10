import localFont from "next/font/local";

// Switzer (Fontshare/ITF, free license), self-hosted so the landing page's
// LCP headline never waits on a third-party stylesheet request chain. Every
// face is preloaded, and every page downloads them when it prefetches the
// homepage, so only the weight the headings use is kept.
export const switzer = localFont({
  src: [
    {
      path: "./_fonts/switzer-semibold.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-switzer",
});
