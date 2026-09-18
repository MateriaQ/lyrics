export type MusixmatchErrCodes =
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "AUTH_FAILED"
  | "API_ERROR"
  | "INTERNAL_ERROR";

export type MusixmatchResult<T> =
  | { success: true; data: T }
  | { success: false; code: MusixmatchErrCodes; message: string };
