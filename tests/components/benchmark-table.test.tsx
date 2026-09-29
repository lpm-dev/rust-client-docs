/* @vitest-environment jsdom */

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { BenchmarkTable } from "@/components/benchmark-table";

afterEach(cleanup);

function Results({ caption = "First install results" }: { caption?: string }) {
  return (
    <BenchmarkTable caption={caption}>
      <table>
        <tbody>
          <tr>
            <td>npm</td>
            <td>863.2</td>
            <td>13,787.5</td>
          </tr>
          <tr>
            <td>Deno ¹</td>
            <td>710.7</td>
            <td>8,156</td>
          </tr>
          <tr>
            <td>LPM CLI</td>
            <td>
              <strong>355.6</strong>
            </td>
            <td>
              <strong>1,594.5</strong>
            </td>
          </tr>
          <tr>
            <td>UPM</td>
            <td>1,125.0</td>
            <td>4,431.5</td>
          </tr>
        </tbody>
      </table>
    </BenchmarkTable>
  );
}

function managerOrder(table: HTMLElement) {
  return within(table)
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[0].textContent);
}

describe("BenchmarkTable", () => {
  it("sorts numeric wall times by default and reverses on click", async () => {
    const user = userEvent.setup();
    render(<Results />);
    const table = screen.getByRole("table", { name: "First install results" });
    expect(managerOrder(table)).toEqual(["LPM CLI", "UPM", "Deno ¹", "npm"]);
    expect(table.querySelector('[aria-sort="ascending"]')?.textContent).toBe(
      "Median wall time (ms)",
    );

    await user.click(
      within(table).getByRole("button", { name: /wall time.*highest first/ }),
    );
    expect(managerOrder(table)).toEqual(["npm", "Deno ¹", "UPM", "LPM CLI"]);
    expect(table.querySelector('[aria-sort="descending"]')?.textContent).toBe(
      "Median wall time (ms)",
    );
  });

  it("starts a new metric lowest first and supports Enter and Space", async () => {
    const user = userEvent.setup();
    render(<Results />);
    const table = screen.getByRole("table");
    const rss = within(table).getByRole("button", {
      name: /peak RSS.*lowest first/,
    });
    rss.focus();
    await user.keyboard("{Enter}");
    expect(managerOrder(table)).toEqual(["LPM CLI", "Deno ¹", "npm", "UPM"]);
    expect(table.querySelectorAll("[aria-sort]")).toHaveLength(1);
    expect(rss.closest("th")?.getAttribute("aria-sort")).toBe("ascending");

    await user.keyboard(" ");
    expect(managerOrder(table)).toEqual(["UPM", "npm", "Deno ¹", "LPM CLI"]);
    expect(rss.closest("th")?.getAttribute("aria-sort")).toBe("descending");
    expect(document.activeElement).toBe(rss);

    await user.click(
      within(table).getByRole("button", { name: /wall time.*lowest first/ }),
    );
    expect(managerOrder(table)).toEqual(["LPM CLI", "UPM", "Deno ¹", "npm"]);
  });

  it("keeps each table independent and keeps values and notes with their manager", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Results />
        <Results caption="Second result table" />
      </>,
    );
    const first = screen.getByRole("table", { name: "First install results" });
    const second = screen.getByRole("table", { name: "Second result table" });
    await user.click(
      within(first).getByRole("button", { name: /peak RSS.*lowest first/ }),
    );
    await user.click(
      within(first).getByRole("button", { name: /peak RSS.*highest first/ }),
    );

    expect(managerOrder(second)).toEqual(["LPM CLI", "UPM", "Deno ¹", "npm"]);
    const deno = within(first).getByText("Deno ¹").closest("tr");
    expect(deno?.textContent).toBe("Deno ¹710.78,156");
    const lpm = within(first).getByText("LPM CLI").closest("tr");
    expect(lpm?.querySelectorAll("strong")).toHaveLength(2);
  });
});
