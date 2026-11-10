/**
 * Fumadocs' table of contents follows the article in the HTML and widens its
 * grid column through `:has()` with this class. On a long page the browser
 * paints the article before it parses that far, at full width, and then
 * narrows it: a layout shift. Opening the article with the same class gives
 * the first paint the column. A page without a table of contents (`full`)
 * leaves it out.
 */
export const TOC_COLUMN_CLASS = "xl:layout:[--fd-toc-width:268px]";

export function TocColumn() {
  return <span hidden className={TOC_COLUMN_CLASS} />;
}
