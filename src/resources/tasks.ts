import { makeResource } from "../lib/resource-factory.js";

export const tasksResource = makeResource({
  cliName: "tasks",
  path: "tasks",
  plural: "tasks",
  singular: "task",
  description: "Tasks — list/get/create/update/delete",
});
