import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";
import { extractOne, flattenOne } from "../lib/flatten.js";
import { globalFlags } from "../lib/config.js";
import { makeResource } from "../lib/resource-factory.js";

const base = makeResource({
  cliName: "notes",
  path: "notes",
  plural: "notes",
  singular: "note",
  description: "Notes — list/get/create/update/delete",
});

base
  .command("add")
  .description("Create a note (markdown) and optionally link to person/company/opportunity")
  .requiredOption("--title <title>", "Note title")
  .option("--markdown <md>", "Body as markdown")
  .option("--person-id <uuid>", "Link via noteTarget")
  .option("--company-id <uuid>", "Link via noteTarget")
  .option("--opportunity-id <uuid>", "Link via noteTarget")
  .option("--json-body <json>", "Extra fields merged into note create")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "text|json|csv|yaml")
  .addHelpText(
    "after",
    `\nExamples:\n  twenty-cli notes add --title "Call 2026-08-10" --markdown "- next: send devis" --person-id <uuid> --json`,
  )
  .action(
    async (opts: {
      title: string;
      markdown?: string;
      personId?: string;
      companyId?: string;
      opportunityId?: string;
      jsonBody?: string;
      json?: boolean;
      format?: string;
    }) => {
      try {
        const body: Record<string, unknown> = { title: opts.title };
        if (opts.markdown) {
          body.bodyV2 = { markdown: opts.markdown };
        }
        if (opts.jsonBody) Object.assign(body, JSON.parse(opts.jsonBody));

        const res = await client.post("/notes", body);
        const note = extractOne("note", res) as Record<string, unknown>;
        const noteId = note?.id as string | undefined;

        let target: unknown = null;
        if (noteId && (opts.personId || opts.companyId || opts.opportunityId)) {
          const tbody: Record<string, unknown> = { noteId };
          if (opts.personId) tbody.personId = opts.personId;
          if (opts.companyId) tbody.companyId = opts.companyId;
          if (opts.opportunityId) tbody.opportunityId = opts.opportunityId;
          const tres = await client.post("/noteTargets", tbody);
          target = extractOne("noteTarget", tres);
        }

        const payload = { note, noteTarget: target };
        const asJson = Boolean(opts.json || globalFlags.json || opts.format === "json");
        if (asJson) {
          output(payload, { json: true });
        } else {
          output(
            {
              ...flattenOne("notes", note || {}),
              linkedPersonId: opts.personId || "",
              linkedCompanyId: opts.companyId || "",
              noteTargetId: (target as any)?.id || "",
            },
            { format: opts.format },
          );
        }
      } catch (err) {
        handleError(err, opts.json);
      }
    },
  );

export const notesResource = base;
