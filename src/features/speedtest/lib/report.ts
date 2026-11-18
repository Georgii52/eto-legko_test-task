import { formatBytes, formatMs } from "../../../shared/lib/index.ts";
import { printLine } from "../../../shared/ui/index.ts";
import type { MeasureProgress, SpeedTestSummary } from "../model/types.ts";

export function printHeader(url: string, requests: number): void {
  printLine(`Target:    ${url}`);
  printLine(`Requests:  ${requests} (sequential)`);
  printLine();
}

export function printRequestLine({ index, total, measurement }: MeasureProgress): void {
  const label = `Request ${String(index).padStart(String(total).length)}... `;
  if (measurement.status === "success") {
    printLine(
      `${label}${measurement.httpStatus}  ${formatMs(measurement.durationMs)}  ${formatBytes(measurement.bytes)}`,
    );
  } else {
    printLine(`${label}failed (${measurement.errorMessage})`);
  }
}

export function printSummary(summary: SpeedTestSummary): void {
  printLine();
  printLine("--- Results ---");
  printLine(`Successful requests:  ${summary.succeeded} / ${summary.total}`);

  if (summary.succeeded === 0) {
    printLine("No successful requests — speed cannot be calculated.");
    return;
  }

  printLine(`Average request time: ${formatMs(summary.avgMs)}`);
  printLine(
    `Total downloaded:     ${formatBytes(summary.totalBytes)} (${summary.totalBytes} bytes)`,
  );
  printLine(`Total time:           ${(summary.totalMs / 1000).toFixed(2)} s`);
  printLine(
    `Download speed:       ${summary.mbps.toFixed(2)} Mbit/s (${summary.MBps.toFixed(2)} MB/s)`,
  );
}
