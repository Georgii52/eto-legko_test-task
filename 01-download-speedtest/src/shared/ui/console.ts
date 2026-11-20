/**
 * Console adapter — the CLI's "UI layer".
 * FSD's shared/ui, adapted for a terminal instead of a browser.
 */
export function printLine(line = ""): void {
  console.log(line);
}

export function printInline(line: string): void {
  process.stdout.write(line);
}

export function printError(line: string): void {
  console.error(line);
}
