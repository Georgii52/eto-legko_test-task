/** Units are documented in README.md: KB/MB are binary (1024-based). */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
  return `${bytes} B`;
}

export function formatMs(ms: number): string {
  return `${ms.toFixed(0)} ms`;
}
