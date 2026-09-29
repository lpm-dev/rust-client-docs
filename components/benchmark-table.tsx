import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  type BenchmarkRow,
  SortableBenchmarkTable,
} from "@/components/sortable-benchmark-table";

function elements(children: ReactNode) {
  return Children.toArray(children).filter(
    (child): child is ReactElement<{ children?: ReactNode }> =>
      isValidElement(child),
  );
}

function cellText(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) =>
      isValidElement<{ children?: ReactNode }>(child)
        ? cellText(child.props.children)
        : String(child),
    )
    .join("");
}

// Keep the numbers in MDX so search and Copy Markdown include the same results.
// Only the table's rendered cells and numeric sort keys cross the client boundary.
export function BenchmarkTable({
  children,
  caption,
}: {
  children: ReactNode;
  caption: string;
}) {
  const [table] = elements(children);
  const body = elements(table?.props.children).find(
    (element) => element.type === "tbody",
  );
  const rows: BenchmarkRow[] = elements(body?.props.children).map((row) => {
    const cells = elements(row.props.children).map(
      (cell) => cell.props.children,
    );
    if (cells.length !== 3) {
      throw new Error("Benchmark tables require three cells per row.");
    }
    const [manager, peakRss, wallTime] = cells;
    const rssValue = Number(cellText(peakRss).replaceAll(",", ""));
    const wallValue = Number(cellText(wallTime).replaceAll(",", ""));
    if (!Number.isFinite(rssValue) || !Number.isFinite(wallValue)) {
      throw new Error("Benchmark metrics must be numeric.");
    }
    return {
      id: cellText(manager),
      cells: [manager, peakRss, wallTime],
      peakRss: rssValue,
      wallTime: wallValue,
    };
  });
  if (rows.length === 0) {
    throw new Error(
      "BenchmarkTable requires a Markdown table with result rows.",
    );
  }

  return <SortableBenchmarkTable caption={caption} rows={rows} />;
}
