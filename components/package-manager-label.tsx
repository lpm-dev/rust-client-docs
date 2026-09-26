import Image from "next/image";
import type { ReactNode } from "react";
import { LpmIcon, NpmIcon, PnpmIcon } from "@/components/brand-icons";

const icons = {
  npm: <NpmIcon className="h-5 w-6 shrink-0" />,
  pnpm: <PnpmIcon />,
  bun: (
    <Image
      src="/brands/bun.svg"
      alt=""
      aria-hidden="true"
      width={20}
      height={20}
      className="size-5 shrink-0"
    />
  ),
  lpm: <LpmIcon color="#2376E3" />,
  firewall: <LpmIcon color="#F2270C" />,
};

export function PackageManagerLabel({
  manager,
  children,
}: {
  manager: keyof typeof icons;
  children: ReactNode;
}) {
  return (
    <span className="not-prose inline-flex items-center gap-1.5 whitespace-nowrap align-middle">
      {icons[manager]}
      <span>{children}</span>
    </span>
  );
}
