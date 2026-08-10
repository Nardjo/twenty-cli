import { makeResource } from "../lib/resource-factory.js";

export const workspaceMembersResource = makeResource({
  cliName: "workspace-members",
  path: "workspaceMembers",
  plural: "workspaceMembers",
  singular: "workspaceMember",
  description: "Workspace members",
});
