"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { type ReactNode, useState } from "react";

export type BenchmarkRow = {
  id: string;
  cells: [ReactNode, ReactNode, ReactNode];
  peakRss: number;
  wallTime: number;
};

type Metric = "peakRss" | "wallTime";
type Direction = "ascending" | "descending";

const metrics = [
  { key: "peakRss", label: "Median peak RSS (MiB)" },
  { key: "wallTime", label: "Median wall time (ms)" },
] as const;

export function SortableBenchmarkTable({
  rows,
  caption,
}: {
  rows: readonly BenchmarkRow[];
  caption: string;
}) {
  const [sort, setSort] = useState<{ metric: Metric; direction: Direction }>({
    metric: "wallTime",
    direction: "ascending",
  });
  const ordered = [...rows].sort(
    (a, b) =>
      (a[sort.metric] - b[sort.metric]) *
      (sort.direction === "ascending" ? 1 : -1),
  );

  return (
    <div className="relative my-6 overflow-auto prose-no-margin">
      <table className="w-full tabular-nums">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Package manager</th>
            {metrics.map(({ key, label }) => {
              const active = sort.metric === key;
              const nextDirection =
                active && sort.direction === "ascending"
                  ? "descending"
                  : "ascending";
              const action = `${label}: sort ${nextDirection === "ascending" ? "lowest" : "highest"} first`;
              const Icon = !active
                ? ArrowUpDown
                : sort.direction === "ascending"
                  ? ArrowUp
                  : ArrowDown;

              return (
                <th
                  key={key}
                  scope="col"
                  aria-sort={active ? sort.direction : undefined}
                  className="text-right"
                >
                  <button
                    type="button"
                    aria-label={action}
                    title={action}
                    className="inline-flex cursor-pointer items-center justify-end gap-1.5 rounded-sm text-right transition-colors hover:text-fd-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fd-primary"
                    onClick={() =>
                      setSort({ metric: key, direction: nextDirection })
                    }
                  >
                    {label}
                    <Icon
                      aria-hidden="true"
                      className={`size-3.5 shrink-0 ${active ? "text-fd-primary" : "text-fd-muted-foreground"}`}
                    />
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {ordered.map((row) => (
            <tr key={row.id}>
              <td>{row.cells[0]}</td>
              <td className="text-right">{row.cells[1]}</td>
              <td className="text-right">{row.cells[2]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
