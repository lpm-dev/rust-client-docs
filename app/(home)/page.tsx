import type { Metadata } from "next";
import Link from "next/link";
import {
  FEATURES,
  type Feature,
  GUARDRAILS,
  HERO_SUB,
  INSTALL_CMD,
  MORE,
} from "@/lib/home-content";
import { homeJsonLd, safeJsonLd } from "@/lib/seo";
import {
  appName,
  homeSeoDescription,
  homeSeoTitle,
  siteUrl,
} from "@/lib/shared";
import { CopyButton } from "./_components/copy-button";
import { Reveal } from "./_components/reveal";
import { TypedHero } from "./_components/typed-hero";
import { switzer } from "./fonts";
import "./home.css";

export const metadata: Metadata = {
  title: {
    absolute: homeSeoTitle,
  },
  description: homeSeoDescription,
  alternates: {
    canonical: siteUrl,
  },
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
        alt: homeSeoTitle,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: homeSeoTitle,
    description: homeSeoDescription,
    images: ["/og/home"],
  },
};

function FeatureGrid({ items, start }: { items: Feature[]; start: number }) {
  return (
    <div className="grid">
      {items.map((feature, index) => (
        <Link key={feature.title} href={feature.href} className="card">
          <div className="card-idx">
            {String(start + index).padStart(2, "0")}
          </div>
          <h3>{feature.title}</h3>
          <p>{feature.body}</p>
          <div className="cmd">{feature.cmd}</div>
        </Link>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD payload is escaped by safeJsonLd
        dangerouslySetInnerHTML={safeJsonLd(homeJsonLd())}
      />

      <div className={`home-root ${switzer.variable}`}>
        <div className="grain" aria-hidden="true" />

        <header className="home-hero">
          <TypedHero />
          <p className="hero-sub">{HERO_SUB}</p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/docs">
              Get Started{" "}
              <span className="arr" aria-hidden="true">
                ↗
              </span>
            </Link>
            <Link className="btn btn-ghost" href="/docs/comparison">
              Comparison
            </Link>
          </div>
        </header>

        <section id="features" className="section">
          <Reveal className="sec-head">
            <div>
              <div className="sec-label">Features</div>
              <h2>
                The whole toolchain.{" "}
                <span className="light">In one binary.</span>
              </h2>
            </div>
          </Reveal>
          <FeatureGrid items={FEATURES} start={1} />
        </section>

        <section id="more" className="section">
          <Reveal className="sec-head">
            <div>
              <div className="sec-label">More</div>
              <h2>
                Beyond install.{" "}
                <span className="light">What LPM CLI unlocks.</span>
              </h2>
            </div>
          </Reveal>
          <FeatureGrid items={MORE} start={7} />
        </section>

        <section id="guardrails" className="section">
          <Reveal className="sec-head">
            <div>
              <div className="sec-label">Even more</div>
              <h2>
                Stay in control.{" "}
                <span className="light">Before anything runs.</span>
              </h2>
            </div>
          </Reveal>
          <FeatureGrid items={GUARDRAILS} start={13} />
        </section>

        <Reveal as="section" id="install" className="section install">
          <h2>
            Power up your <span className="light">workflow.</span>
          </h2>
          <div className="copybox">
            <span>
              <span className="prmpt">$ </span>
              {INSTALL_CMD}
            </span>
            <CopyButton />
          </div>
        </Reveal>
      </div>
    </>
  );
}
