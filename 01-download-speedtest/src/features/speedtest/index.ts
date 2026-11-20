// Public API of the speedtest feature. Import the feature only through this file.
export { runSequential, measureOnce } from "./lib/measure.ts";
export { summarize } from "./lib/stats.ts";
export { printHeader, printRequestLine, printSummary } from "./lib/report.ts";
export type {
  SpeedTestOptions,
  SpeedTestSummary,
  MeasureProgress,
} from "./model/types.ts";
