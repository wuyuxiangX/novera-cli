/** Error types surfaced by the SDK. */

/** A request reached the API but it returned a non-success envelope or status. */
export class NoveraApiError extends Error {
  readonly status: number;
  readonly code: number | undefined;

  constructor(message: string, status: number, code?: number) {
    super(message);
    this.name = "NoveraApiError";
    this.status = status;
    this.code = code;
  }
}

/** The credential is missing, expired, or was revoked — the caller should
 *  re-authenticate (`novera login`) or fix `NOVERA_API_KEY`. */
export class NoveraAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NoveraAuthError";
  }
}
