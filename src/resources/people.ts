import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError, CliError } from "../lib/errors.js";
import { extractOne, flattenOne } from "../lib/flatten.js";
import { makeResource } from "../lib/resource-factory.js";

const base = makeResource({
  cliName: "people",
  path: "people",
  plural: "people",
  singular: "person",
  description: "People (contacts) — list/get/create/update/delete",
});

/** Parse phone into Twenty phones composite. Accepts +33612345678 or 0612345678. */
function buildPhones(phone: string): Record<string, unknown> {
  const cleaned = phone.replace(/[\s.-]/g, "");
  let callingCode = "";
  let number = cleaned;
  if (cleaned.startsWith("+")) {
    const m = cleaned.match(/^\+(\d{1,3})(\d+)$/);
    if (m) {
      callingCode = `+${m[1]}`;
      number = m[2];
    }
  } else if (cleaned.startsWith("00")) {
    const m = cleaned.match(/^00(\d{1,3})(\d+)$/);
    if (m) {
      callingCode = `+${m[1]}`;
      number = m[2];
    }
  }
  if (!callingCode && /^0[67]\d{8}$/.test(cleaned)) {
    callingCode = "+33";
    number = cleaned.slice(1);
  }
  return {
    primaryPhoneNumber: number,
    ...(callingCode ? { primaryPhoneCallingCode: callingCode } : {}),
    ...(callingCode === "+33" ? { primaryPhoneCountryCode: "FR" } : {}),
    additionalPhones: [],
  };
}

base
  .command("create-contact")
  .description("Create a person with friendly flags (or merge --json-body)")
  .option("--first-name <name>", "First name")
  .option("--last-name <name>", "Last name")
  .option("--email <email>", "Primary email")
  .option("--phone <phone>", "Primary phone (+33… or 06…)")
  .option("--job-title <title>", "Job title")
  .option("--city <city>", "City")
  .option("--company-id <uuid>", "Link to company")
  .option("--json-body <json>", "Extra/override JSON merged over flags")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "text|json|csv|yaml")
  .addHelpText(
    "after",
    `\nExamples:\n  twenty-cli people create-contact --first-name Sonny --last-name Dénarié --email a@b.com --phone +33643552605 --job-title "Co-fondateur" --company-id <uuid> --json`,
  )
  .action(
    async (opts: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      jobTitle?: string;
      city?: string;
      companyId?: string;
      jsonBody?: string;
      json?: boolean;
      format?: string;
    }) => {
      try {
        const body: Record<string, unknown> = {};
        if (opts.firstName || opts.lastName) {
          body.name = {
            firstName: opts.firstName || "",
            lastName: opts.lastName || "",
          };
        }
        if (opts.email) {
          body.emails = { primaryEmail: opts.email, additionalEmails: [] };
        }
        if (opts.phone) {
          body.phones = buildPhones(opts.phone);
        }
        if (opts.jobTitle) body.jobTitle = opts.jobTitle;
        if (opts.city) body.city = opts.city;
        if (opts.companyId) body.companyId = opts.companyId;
        if (opts.jsonBody) {
          Object.assign(body, JSON.parse(opts.jsonBody));
        }
        if (Object.keys(body).length === 0) {
          throw new CliError(2, "Provide at least one field or --json-body");
        }
        const res = await client.post("/people", body);
        const one = extractOne("person", res) as Record<string, unknown>;
        if (opts.json || opts.format === "json") {
          output(one, { json: true });
        } else {
          output(flattenOne("people", one || {}), { format: opts.format });
        }
      } catch (err) {
        handleError(err, opts.json);
      }
    },
  );

base
  .command("find")
  .description("Find people by email, phone fragment, or first name (builds a filter)")
  .option("--email <email>", "Exact primary email")
  .option("--phone <phone>", "Phone contains (digits)")
  .option("--name <text>", "ilike on first name")
  .option("--limit <n>", "Max", "20")
  .option("--depth <n>", "0|1", "1")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "text|json|csv|yaml")
  .action(
    async (opts: {
      email?: string;
      phone?: string;
      name?: string;
      limit?: string;
      depth?: string;
      json?: boolean;
      format?: string;
    }) => {
      try {
        const parts: string[] = [];
        if (opts.email) parts.push(`emails.primaryEmail[eq]:${opts.email}`);
        if (opts.phone) {
          const digits = opts.phone.replace(/\D/g, "");
          parts.push(`phones.primaryPhoneNumber[ilike]:%${digits}%`);
        }
        if (opts.name) {
          parts.push(`name.firstName[ilike]:%${opts.name}%`);
        }
        if (parts.length === 0) {
          throw new CliError(2, "Provide --email, --phone, or --name");
        }
        const { extractList, flattenRecords } = await import("../lib/flatten.js");
        const res = await client.get("/people", {
          filter: parts.join(","),
          limit: opts.limit || "20",
          depth: opts.depth || "1",
        });
        const rows = extractList("people", res);
        if (opts.json || opts.format === "json") {
          output(
            { items: rows, totalCount: (res as any)?.totalCount, pageInfo: (res as any)?.pageInfo },
            { json: true },
          );
        } else {
          output(flattenRecords("people", rows), { format: opts.format });
        }
      } catch (err) {
        handleError(err, opts.json);
      }
    },
  );

export const peopleResource = base;
