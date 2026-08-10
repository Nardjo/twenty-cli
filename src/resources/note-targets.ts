import { makeResource } from "../lib/resource-factory.js";

export const noteTargetsResource = makeResource({
  cliName: "note-targets",
  path: "noteTargets",
  plural: "noteTargets",
  singular: "noteTarget",
  description: "Note targets (link notes ↔ person/company/opportunity)",
});
