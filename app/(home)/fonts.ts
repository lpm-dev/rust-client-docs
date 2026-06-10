import localFont from "next/font/local";

// Switzer (Fontshare/ITF, free license), self-hosted so the landing page's
// LCP headline never waits on a third-party stylesheet request chain.
export const switzer = localFont({
  src: [
    { path: "./_fonts/switzer-regular.woff2", weight: "400", style: "normal" },
    { path: "./_fonts/switzer-medium.woff2", weight: "500", style: "normal" },
    {
      path: "./_fonts/switzer-semibold.woff2",
      weight: "600",
      style: "normal",
    },
    { path: "./_fonts/switzer-bold.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-switzer",
});
