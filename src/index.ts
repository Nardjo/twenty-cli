#!/usr/bin/env bun
import { Command } from "commander";
import { globalFlags } from "./lib/config.js";
import { authCommand } from "./commands/auth.js";
import { peopleResource } from "./resources/people.js";
import { companiesResource } from "./resources/companies.js";
import { opportunitiesResource } from "./resources/opportunities.js";
import { notesResource } from "./resources/notes.js";
import { noteTargetsResource } from "./resources/note-targets.js";
import { tasksResource } from "./resources/tasks.js";
import { taskTargetsResource } from "./resources/task-targets.js";
import { timelineActivitiesResource } from "./resources/timeline-activities.js";
import { workspaceMembersResource } from "./resources/workspace-members.js";
import { rawResource } from "./resources/raw.js";

const program = new Command();

program
  .name("twenty-cli")
  .description(
    "Agent-ready CLI for Twenty CRM REST API (people, companies, opportunities, notes, tasks). Cloud & self-hosted.",
  )
  .version("0.1.0")
  .option("--json", "Output as JSON", false)
  .option("--format <fmt>", "Output format: text, json, csv, yaml", "text")
  .option("--verbose", "Enable debug logging", false)
  .option("--no-color", "Disable colored output")
  .option("--no-header", "Omit table/csv headers (for piping)")
  .hook("preAction", (_thisCmd, actionCmd) => {
    const root = actionCmd.optsWithGlobals();
    globalFlags.json = root.json ?? false;
    globalFlags.format = root.format ?? "text";
    globalFlags.verbose = root.verbose ?? false;
    globalFlags.noColor = root.color === false;
    globalFlags.noHeader = root.header === false;
  });

program.addCommand(authCommand);
program.addCommand(peopleResource);
program.addCommand(companiesResource);
program.addCommand(opportunitiesResource);
program.addCommand(notesResource);
program.addCommand(noteTargetsResource);
program.addCommand(tasksResource);
program.addCommand(taskTargetsResource);
program.addCommand(timelineActivitiesResource);
program.addCommand(workspaceMembersResource);
program.addCommand(rawResource);

program.parse();
