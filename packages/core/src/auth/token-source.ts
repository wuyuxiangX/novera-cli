/** A source of bearer tokens for the API client. Implementations: a static PAT
 *  from the environment, or an OAuth credential that auto-refreshes. */
export interface TokenSource {
  getToken(): Promise<string>;
}
