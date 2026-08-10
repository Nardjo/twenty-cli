import { makeResource } from "../lib/resource-factory.js";

export const timelineActivitiesResource = makeResource({
  cliName: "timeline-activities",
  path: "timelineActivities",
  plural: "timelineActivities",
  singular: "timelineActivity",
  description: "Timeline activities",
});
