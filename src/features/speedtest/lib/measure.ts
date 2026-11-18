import type { RequestMeasurement } from "../../../entities/measured-request/index.ts";
import type { MeasureProgress, SpeedTestOptions } from "../model/types.ts";

/**
 * One request, fully downloaded. Errors are captured into the result
 * (allSettled semantics) — this function never throws.
 */
export async function measureOnce(url: string): Promise<RequestMeasurement> {
  const started = performance.now();
  try {
    const response = await fetch(url, { redirect: "follow" });
    if (!response.ok) {
      return {
        status: "failure",
        errorMessage: `HTTP ${response.status} ${response.statusText}`.trimEnd(),
      };
    }
    const body = await response.arrayBuffer();
    return {
      status: "success",
      durationMs: performance.now() - started,
      bytes: body.byteLength,
      httpStatus: response.status,
    };
  } catch (err) {
    return {
      status: "failure",
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * N strictly sequential requests (the next one starts only after the
 * previous body is fully downloaded). A failed request does NOT abort
 * the run — it is recorded and the series continues.
 */
export async function runSequential(
  options: SpeedTestOptions,
  onResult: (progress: MeasureProgress) => void,
): Promise<RequestMeasurement[]> {
  const results: RequestMeasurement[] = [];
  for (let i = 1; i <= options.requests; i++) {
    const measurement = await measureOnce(options.url);
    onResult({ index: i, total: options.requests, measurement });
    results.push(measurement);
  }
  return results;
}
