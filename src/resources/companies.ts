import { makeResource } from "../lib/resource-factory.js";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError, CliError } from "../lib/errors.js";
import { extractOne, flattenOne } from "../lib/flatten.js";

const base = makeResource({
  cliName: "companies",
  path: "companies",
  plural: "companies",
  singular: "company",
  description: "Companies — list/get/create/update/delete",
});

base
  .command("create-company")
  .description("Create a company with friendly flags")
  .requiredOption("--name <name>", "Company name")
  .option("--domain <url>", "Website URL (stored in domainName)")
  .option("--employees <n>", "Employee count")
  .option("--json-body <json>", "Extra/override JSON")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "text|json|csv|yaml")
  .action(
    async (opts: {
      name: string;
      domain?: string;
      employees?: string;
      jsonBody?: string;
      json?: boolean;
      format?: string;
    }) => {
      try {
        const body: Record<string, unknown> = { name: opts.name };
        if (opts.domain) {
          body.domainName = { primaryLinkUrl: opts.domain, primaryLinkLabel: "", secondaryLinks: [] };
        }
        if (opts.employees) body.employees = Number(opts.employees);
        if (opts.jsonBody) Object.assign(body, JSON.parse(opts.jsonBody));
        const res = await client.post("/companies", body);
        const one = extractOne("company", res) as Record<string, unknown>;
        if (opts.json || opts.format === "json") output(one, { json: true });
        else output(flattenOne("companies", one || {}), { format: opts.format });
      } catch (err) {
        handleError(err, opts.json);
      }
    },
  );

export const companiesResource = base;
