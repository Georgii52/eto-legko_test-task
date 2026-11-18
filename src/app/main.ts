#!/usr/bin/env node
/**
 * Download speed test — CLI entry point.
 *
 * Makes N sequential requests to the given URL, waits for each response
 * to fully download, and reports average request time, total bytes and
 * download speed. Units are documented in README.md.
 *
 * Usage: node src/app/main.ts <url> [--requests N]
 */
import {
  printHeader,
  printRequestLine,
  printSummary,
  runSequential,
  summarize,
} from "../features/speedtest/index.ts";
import { printError } from "../shared/ui/index.ts";
import { parseCliArgs } from "./lib/parse-cli-args.ts";

async function main(): Promise<void> {
  const { url, requests } = parseCliArgs(process.argv.slice(2));

  printHeader(url, requests);

  // Sequential run; a failed request is recorded, not thrown — the series
  // continues and statistics cover the successful ones.
  const measurements = await runSequential({ url, requests }, printRequestLine);
  const summary = summarize(measurements);

  printSummary(summary);

  // Non-zero exit so CI/scripts can detect a partially failed run.
  if (summary.failed > 0) {
    printError(`\n${summary.failed} of ${summary.total} requests failed.`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  printError(`Unexpected error: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
