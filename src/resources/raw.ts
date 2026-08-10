import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError, CliError } from "../lib/errors.js";

/** Escape hatch for any REST path under the Twenty /rest base. */
export const rawResource = new Command("raw").description(
  "Raw REST against /rest (path without leading domain)",
);

function parseQuery(q?: string): Record<string, string> | undefined {
  if (!q) return undefined;
  try {
    const obj = JSON.parse(q);
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, String(v)]));
  } catch {
    throw new CliError(2, "--query must be a JSON object of stringable values");
  }
}

rawResource
  .command("get")
  .description("GET /rest/<path>")
  .argument("<path>", "Path e.g. people or people/<id>")
  .option("--query <json>", 'Query params JSON e.g. \'{"limit":"10"}\'')
  .option("--json", "Output as JSON")
  .action(async (path: string, opts: { query?: string; json?: boolean }) => {
    try {
      const p = path.startsWith("/") ? path : `/${path}`;
      const data = await client.get(p, parseQuery(opts.query));
      output(data, { json: opts.json ?? true });
    } catch (err) {
      handleError(err, opts.json ?? true);
    }
  });

rawResource
  .command("post")
  .description("POST /rest/<path>")
  .argument("<path>", "Path e.g. people")
  .option("--json-body <json>", "JSON body", "{}")
  .option("--json", "Output as JSON")
  .action(async (path: string, opts: { jsonBody?: string; json?: boolean }) => {
    try {
      const p = path.startsWith("/") ? path : `/${path}`;
      const body = JSON.parse(opts.jsonBody || "{}");
      const data = await client.post(p, body);
      output(data, { json: opts.json ?? true });
    } catch (err) {
      handleError(err, opts.json ?? true);
    }
  });

rawResource
  .command("patch")
  .description("PATCH /rest/<path>")
  .argument("<path>", "Path e.g. people/<id>")
  .option("--json-body <json>", "JSON body", "{}")
  .option("--json", "Output as JSON")
  .action(async (path: string, opts: { jsonBody?: string; json?: boolean }) => {
    try {
      const p = path.startsWith("/") ? path : `/${path}`;
      const body = JSON.parse(opts.jsonBody || "{}");
      const data = await client.patch(p, body);
      output(data, { json: opts.json ?? true });
    } catch (err) {
      handleError(err, opts.json ?? true);
    }
  });

rawResource
  .command("delete")
  .description("DELETE /rest/<path>")
  .argument("<path>", "Path e.g. people/<id>")
  .option("--json", "Output as JSON")
  .action(async (path: string, opts: { json?: boolean }) => {
    try {
      const p = path.startsWith("/") ? path : `/${path}`;
      const data = await client.delete(p);
      output(data ?? { deleted: true, path: p }, { json: opts.json ?? true });
    } catch (err) {
      handleError(err, opts.json ?? true);
    }
  });
