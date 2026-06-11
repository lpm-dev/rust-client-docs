import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import PostHogProvider from "@/components/posthog-provider";
import { SiteHeader } from "@/components/site-header";
import {
  appName,
  appTagline,
  homeSeoDescription,
  homeSeoTitle,
  siteUrl,
} from "@/lib/shared";
import "./global.css";

const inter = Inter({
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#2376E3",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: homeSeoTitle,
    template: `%s — ${appName}`,
  },
  description: homeSeoDescription,
  applicationName: appName,
  openGraph: {
    type: "website",
    siteName: appName,
    title: homeSeoTitle,
    description: homeSeoDescription,
    url: siteUrl,
    images: [
      {
        url: "/og/home",
        width: 1200,
        height: 630,
        alt: `${appName} — ${appTagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: homeSeoTitle,
    description: homeSeoDescription,
    images: ["/og/home"],
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    other: {
      "msvalidate.01": "15A27CC3490BC984B8BE766FE51A4E02",
    },
  },
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>
          <PostHogProvider>
            <SiteHeader />
            <div className="flex-1 flex flex-col">{children}</div>
          </PostHogProvider>
        </RootProvider>
      </body>
    </html>
  );
}
