/**
 * Result of a single measured HTTP request.
 * Never throws: network/HTTP errors are captured as `failure` so that
 * one bad request cannot abort the whole run.
 */
export type RequestMeasurement =
  | {
      status: "success";
      /** milliseconds, request start to fully downloaded body */
      durationMs: number;
      /** body size in bytes */
      bytes: number;
      /** HTTP status code, e.g. 200 */
      httpStatus: number;
    }
  | {
      status: "failure";
      errorMessage: string;
    };
