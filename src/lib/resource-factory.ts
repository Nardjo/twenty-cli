import { Command } from "commander";
import { client } from "./client.js";
import { output } from "./output.js";
import { handleError, CliError } from "./errors.js";
import { globalFlags } from "./config.js";
import { extractList, extractOne, flattenOne, flattenRecords } from "./flatten.js";

export interface ResourceDef {
  /** CLI command name (kebab), e.g. people, note-targets */
  cliName: string;
  /** REST path segment, e.g. people, noteTargets */
  path: string;
  /** Plural key in JSON data, usually same as path */
  plural: string;
  /** Singular key in JSON data for one-record responses */
  singular: string;
  description: string;
}

interface CommonOpts {
  json?: boolean;
  format?: string;
  filter?: string;
  orderBy?: string;
  limit?: string;
  depth?: string;
  startingAfter?: string;
  endingBefore?: string;
  jsonBody?: string;
  soft?: boolean;
}

function listParams(opts: CommonOpts): Record<string, string> {
  const params: Record<string, string> = {};
  if (opts.filter) params.filter = opts.filter;
  if (opts.orderBy) params.order_by = opts.orderBy;
  if (opts.limit) params.limit = opts.limit;
  if (opts.depth) params.depth = opts.depth;
  if (opts.startingAfter) params.starting_after = opts.startingAfter;
  if (opts.endingBefore) params.ending_before = opts.endingBefore;
  return params;
}

function parseBody(jsonBody?: string): Record<string, unknown> {
  if (!jsonBody) throw new CliError(2, "Provide --json-body '<json>'");
  try {
    const parsed = JSON.parse(jsonBody);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("body must be a JSON object");
    }
    return parsed as Record<string, unknown>;
  } catch (e) {
    throw new CliError(2, `Invalid JSON body: ${(e as Error).message}`);
  }
}

function wantsJson(opts: CommonOpts): boolean {
  return Boolean(opts.json || globalFlags.json || opts.format === "json" || globalFlags.format === "json");
}

function presentList(def: ResourceDef, res: unknown, opts: CommonOpts): void {
  const rows = extractList(def.plural, res);
  if (wantsJson(opts)) {
    // Full records + cursor meta for agents
    output(
      {
        items: rows,
        totalCount: (res as any)?.totalCount,
        pageInfo: (res as any)?.pageInfo,
      },
      { json: true },
    );
    return;
  }
  output(flattenRecords(def.plural, rows), { json: false, format: opts.format });
}

function presentOne(def: ResourceDef, res: unknown, opts: CommonOpts): void {
  const one = extractOne(def.singular, res) as Record<string, unknown>;
  if (wantsJson(opts)) {
    output(one, { json: true });
    return;
  }
  output(flattenOne(def.plural, one || {}), { json: false, format: opts.format });
}

/** Build a standard CRUD resource command for a Twenty REST object. */
export function makeResource(def: ResourceDef): Command {
  const cmd = new Command(def.cliName).description(def.description);
  const base = `/${def.path}`;

  cmd
    .command("list")
    .description(`List ${def.plural}`)
    .option("--filter <expr>", "Twenty filter, e.g. emails.primaryEmail[eq]:a@b.com")
    .option("--order-by <expr>", "Sort, e.g. createdAt[DescNullsLast]")
    .option("--limit <n>", "Max records (0-200)", "60")
    .option("--depth <n>", "Relation depth 0|1", "1")
    .option("--starting-after <cursor>", "Pagination cursor")
    .option("--ending-before <cursor>", "Pagination cursor")
    .option("--json", "Output as JSON")
    .option("--format <fmt>", "text|json|csv|yaml")
    .addHelpText(
      "after",
      `\nExamples:\n  twenty-cli ${def.cliName} list --limit 20 --json\n  twenty-cli ${def.cliName} list --filter 'name.firstName[ilike]:%ann%' --depth 0`,
    )
    .action(async (opts: CommonOpts) => {
      try {
        const res = await client.get(base, listParams(opts));
        presentList(def, res, opts);
      } catch (err) {
        handleError(err, opts.json);
      }
    });

  cmd
    .command("get")
    .description(`Get one ${def.singular} by id`)
    .argument("<id>", "Record UUID")
    .option("--depth <n>", "Relation depth 0|1", "1")
    .option("--json", "Output as JSON")
    .option("--format <fmt>", "text|json|csv|yaml")
    .action(async (id: string, opts: CommonOpts) => {
      try {
        const params: Record<string, string> = {};
        if (opts.depth) params.depth = opts.depth;
        const res = await client.get(`${base}/${id}`, params);
        presentOne(def, res, opts);
      } catch (err) {
        handleError(err, opts.json);
      }
    });

  cmd
    .command("create")
    .description(`Create one ${def.singular}`)
    .option("--json-body <json>", "Full JSON body (Twenty schema)")
    .option("--json", "Output as JSON")
    .option("--format <fmt>", "text|json|csv|yaml")
    .addHelpText("after", `\nExample:\n  twenty-cli ${def.cliName} create --json-body '{"title":"Hello"}' --json`)
    .action(async (opts: CommonOpts) => {
      try {
        const body = parseBody(opts.jsonBody);
        const res = await client.post(base, body);
        presentOne(def, res, opts);
      } catch (err) {
        handleError(err, opts.json);
      }
    });

  cmd
    .command("update")
    .description(`Update one ${def.singular} by id`)
    .argument("<id>", "Record UUID")
    .option("--json-body <json>", "Partial JSON body")
    .option("--json", "Output as JSON")
    .option("--format <fmt>", "text|json|csv|yaml")
    .action(async (id: string, opts: CommonOpts) => {
      try {
        const body = parseBody(opts.jsonBody);
        const res = await client.patch(`${base}/${id}`, body);
        presentOne(def, res, opts);
      } catch (err) {
        handleError(err, opts.json);
      }
    });

  cmd
    .command("delete")
    .description(`Delete one ${def.singular} by id (soft-delete unless --hard)`)
    .argument("<id>", "Record UUID")
    .option("--hard", "Permanent delete if supported by API (sends soft_delete=false when available)", false)
    .option("--json", "Output as JSON")
    .action(async (id: string, opts: CommonOpts & { hard?: boolean }) => {
      try {
        const params: Record<string, string> = {};
        // Twenty uses soft delete by default; hard delete varies by version — pass nothing unless hard
        if (opts.hard) params.soft_delete = "false";
        const res = await client.delete(`${base}/${id}${params.soft_delete ? `?soft_delete=false` : ""}`);
        if (opts.json) {
          output(res ?? { id, deleted: true }, { json: true });
        } else {
          output({ id, deleted: true }, {});
        }
      } catch (err) {
        handleError(err, opts.json);
      }
    });

  return cmd;
}
