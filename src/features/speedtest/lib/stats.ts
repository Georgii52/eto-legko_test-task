import type { SpeedTestSummary } from "../model/types.ts";
import type { RequestMeasurement } from "../../../entities/measured-request/index.ts";

/**
 * Aggregates measurements into a summary. Statistics are computed over
 * successful requests only; failures are counted separately.
 */
export function summarize(measurements: readonly RequestMeasurement[]): SpeedTestSummary {
  const succeeded = measurements.filter((m) => m.status === "success");
  const failed = measurements.length - succeeded.length;
  const totalBytes = succeeded.reduce((sum, m) => sum + m.bytes, 0);
  const totalMs = succeeded.reduce((sum, m) => sum + m.durationMs, 0);
  const avgMs = succeeded.length > 0 ? totalMs / succeeded.length : 0;
  const mbps = totalMs > 0 ? (totalBytes * 8) / (totalMs / 1000) / 1_000_000 : 0;
  const MBps = totalMs > 0 ? totalBytes / (totalMs / 1000) / (1024 * 1024) : 0;

  return {
    total: measurements.length,
    succeeded: succeeded.length,
    failed,
    totalBytes,
    totalMs,
    avgMs,
    mbps,
    MBps,
    measurements,
  };
}
