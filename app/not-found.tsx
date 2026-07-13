import { ArrowRight, House } from "lucide-react";
import Link from "next/link";
import { switzer } from "./(home)/fonts";
import styles from "./not-found.module.css";

const RECOVERY_LINKS = [
  {
    label: "Start here",
    title: "Install LPM",
    detail: "Get the CLI running on your machine.",
    href: "/docs/installation",
    command: "lpm --version",
  },
  {
    label: "Package workflow",
    title: "Install packages",
    detail: "Add dependencies or restore a project.",
    href: "/docs/packages/install",
    command: "lpm install",
  },
  {
    label: "Find a command",
    title: "CLI reference",
    detail: "Scan every command from one page.",
    href: "/docs/commands",
    command: "lpm --help",
  },
];

export default function NotFound() {
  return (
    <main
      className={`${styles.root} ${switzer.variable}`}
      aria-labelledby="not-found-title"
    >
      <div className={styles.grid} aria-hidden="true" />

      <div className={styles.shell}>
        <div className={styles.status}>
          <span className={styles.statusDot} aria-hidden="true" />
          <span>Error 404</span>
          <span className={styles.statusCode}>route_not_found</span>
        </div>

        <div className={styles.hero}>
          <div className={styles.copy}>
            <p className={styles.kicker}>
              <span aria-hidden="true">›</span> lpm docs resolve
            </p>
            <h1 id="not-found-title">This route isn&apos;t in the graph.</h1>
            <p className={styles.description}>
              The page may have moved, been renamed, or never existed. Search
              from the header, or jump back into a known part of the LPM CLI
              docs.
            </p>

            <div className={styles.actions}>
              <Link className={styles.primaryAction} href="/docs">
                Browse the docs
                <ArrowRight aria-hidden="true" className={styles.actionIcon} />
              </Link>
              <Link className={styles.secondaryAction} href="/">
                <House aria-hidden="true" className={styles.actionIcon} />
                Go home
              </Link>
            </div>
          </div>

          <div className={styles.visual} aria-hidden="true">
            <div className={styles.digits}>404</div>
            <div className={styles.terminal}>
              <div className={styles.terminalBar}>
                <span />
                <span />
                <span />
                <strong>route resolver</strong>
              </div>
              <div className={styles.terminalBody}>
                <p>
                  <span className={styles.prompt}>$</span> lpm docs resolve
                  ./requested-route
                </p>
                <p className={styles.errorLine}>
                  <span>×</span> no matching page
                </p>
                <p className={styles.successLine}>
                  <span>→</span> recovery routes ready
                </p>
              </div>
            </div>
          </div>
        </div>

        <nav className={styles.recovery} aria-label="Popular documentation">
          {RECOVERY_LINKS.map((item) => (
            <Link
              className={styles.recoveryLink}
              href={item.href}
              key={item.href}
            >
              <span className={styles.recoveryLabel}>{item.label}</span>
              <span className={styles.recoveryTitle}>
                {item.title}
                <span aria-hidden="true">↗</span>
              </span>
              <span className={styles.recoveryDetail}>{item.detail}</span>
              <code>{item.command}</code>
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
