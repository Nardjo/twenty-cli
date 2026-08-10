import { makeResource } from "../lib/resource-factory.js";

export const taskTargetsResource = makeResource({
  cliName: "task-targets",
  path: "taskTargets",
  plural: "taskTargets",
  singular: "taskTarget",
  description: "Task targets (link tasks ↔ person/company/opportunity)",
});
