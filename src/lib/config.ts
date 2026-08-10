import { homedir } from "os";
import { join } from "path";

/** Application name (replaced during api2cli create) */
export const APP_NAME = "twenty";

/** CLI binary name (replaced during api2cli create) */
export const APP_CLI = "twenty-cli";

/**
 * REST base URL (no trailing slash).
 * Override with TWENTY_BASE_URL — accept root (`https://crm.example.com`)
 * or already-suffixed (`https://crm.example.com/rest`).
 * Default: Twenty Cloud.
 */
function resolveBaseUrl(): string {
  const raw = (process.env.TWENTY_BASE_URL || "https://api.twenty.com").replace(/\/+$/, "");
  if (raw.endsWith("/rest")) return raw;
  return `${raw}/rest`;
}

export const BASE_URL = resolveBaseUrl();

/** Auth type: bearer | api-key | basic | custom */
export const AUTH_TYPE = "bearer";

/** Auth header name (e.g. Authorization, X-Api-Key) */
export const AUTH_HEADER = "Authorization";

/** Path to the token file for this CLI */
export const TOKEN_PATH = join(homedir(), ".config", "tokens", `${APP_NAME}-cli.txt`);

/** Global state for output flags (set by root command) */
export const globalFlags = {
  json: false,
  format: "text" as "text" | "json" | "csv" | "yaml",
  verbose: false,
  noColor: false,
  noHeader: false,
};
