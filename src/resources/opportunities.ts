import { makeResource } from "../lib/resource-factory.js";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";
import { extractOne, flattenOne } from "../lib/flatten.js";

const base = makeResource({
  cliName: "opportunities",
  path: "opportunities",
  plural: "opportunities",
  singular: "opportunity",
  description: "Opportunities — list/get/create/update/delete",
});

base
  .command("create-opp")
  .description("Create an opportunity with friendly flags")
  .requiredOption("--name <name>", "Opportunity name")
  .option("--stage <stage>", "NEW|SCREENING|MEETING|PROPOSAL|CUSTOMER", "NEW")
  .option("--company-id <uuid>", "Company id")
  .option("--point-of-contact-id <uuid>", "Person id")
  .option("--amount-euros <n>", "Amount in euros (converted to micros)")
  .option("--currency <code>", "Currency code", "EUR")
  .option("--close-date <iso>", "Close date ISO")
  .option("--json-body <json>", "Extra/override JSON")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "text|json|csv|yaml")
  .action(
    async (opts: {
      name: string;
      stage?: string;
      companyId?: string;
      pointOfContactId?: string;
      amountEuros?: string;
      currency?: string;
      closeDate?: string;
      jsonBody?: string;
      json?: boolean;
      format?: string;
    }) => {
      try {
        const body: Record<string, unknown> = {
          name: opts.name,
          stage: opts.stage || "NEW",
        };
        if (opts.companyId) body.companyId = opts.companyId;
        if (opts.pointOfContactId) body.pointOfContactId = opts.pointOfContactId;
        if (opts.closeDate) body.closeDate = opts.closeDate;
        if (opts.amountEuros != null) {
          const euros = Number(opts.amountEuros);
          body.amount = {
            amountMicros: Math.round(euros * 1_000_000),
            currencyCode: opts.currency || "EUR",
          };
        }
        if (opts.jsonBody) Object.assign(body, JSON.parse(opts.jsonBody));
        const res = await client.post("/opportunities", body);
        const one = extractOne("opportunity", res) as Record<string, unknown>;
        if (opts.json || opts.format === "json") output(one, { json: true });
        else output(flattenOne("opportunities", one || {}), { format: opts.format });
      } catch (err) {
        handleError(err, opts.json);
      }
    },
  );

export const opportunitiesResource = base;
