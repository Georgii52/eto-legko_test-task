import { printError } from "../../shared/ui/index.ts";

const DEFAULT_REQUESTS = 10;

export interface CliOptions {
  url: string;
  requests: number;
}

/** Parses argv; exits the process with code 2 on usage errors. */
export function parseCliArgs(argv: readonly string[]): CliOptions {
  const positional: string[] = [];
  let requests = DEFAULT_REQUESTS;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === undefined) continue;
    if (arg === "--requests") {
      const value = argv[++i];
      const parsed = value === undefined ? NaN : Number(value);
      if (!Number.isInteger(parsed) || parsed < 1) {
        printError(`Invalid --requests value: ${value} (expected a positive integer)`);
        process.exit(2);
      }
      requests = parsed;
    } else {
      positional.push(arg);
    }
  }

  const url = positional[0];
  if (url === undefined) {
    printError("Usage: node src/app/main.ts <url> [--requests N]");
    process.exit(2);
  }
  try {
    // Validate early: throws on anything that is not an absolute http(s) URL.
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error(`unsupported protocol: ${parsed.protocol}`);
    }
  } catch (err) {
    printError(`Invalid URL: ${url} (${err instanceof Error ? err.message : err})`);
    process.exit(2);
  }

  return { url, requests };
}
