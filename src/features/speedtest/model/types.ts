import type { RequestMeasurement } from "../../../entities/measured-request/index.ts";

export interface SpeedTestOptions {
  url: string;
  requests: number;
}

export interface MeasureProgress {
  /** 1-based request number */
  index: number;
  total: number;
  measurement: RequestMeasurement;
}

export interface SpeedTestSummary {
  total: number;
  succeeded: number;
  failed: number;
  /** bytes accumulated over successful requests only */
  totalBytes: number;
  /** milliseconds accumulated over successful requests only */
  totalMs: number;
  avgMs: number;
  /** decimal megabits per second (1 Mbit/s = 1_000_000 bit/s) */
  mbps: number;
  /** binary megabytes per second (1 MB/s = 1_048_576 B/s) */
  MBps: number;
  measurements: readonly RequestMeasurement[];
}
