import { parseArgs } from "./core/args.js";
import { runApiCommand } from "./commands/api.js";
import { runAuthCommand } from "./commands/auth.js";
import { runChecklistsCommand } from "./commands/checklists.js";
import { runCustomersCommand } from "./commands/customers.js";
import { runEmployeesCommand } from "./commands/employees.js";
import { runEstimatesCommand } from "./commands/estimates.js";
import { runJobsCommand } from "./commands/jobs.js";
import { runJobTypesCommand } from "./commands/job-types.js";
import { runLeadSourcesCommand } from "./commands/lead-sources.js";
import { runLeadsCommand } from "./commands/leads.js";
import { runPipelineStatusesCommand } from "./commands/pipeline-statuses.js";
import { runPriceFormsCommand } from "./commands/price-forms.js";
import { runRoutesCommand } from "./commands/routes.js";
import { runCompanyCommand } from "./commands/company.js";
import { runInvoicesCommand } from "./commands/invoices.js";
import { printText } from "./core/output.js";
import { HELP_TEXT } from "./help.js";

export async function run(argv) {
  const parsed = parseArgs(argv);
  const [command, ...rest] = parsed.positionals;

  if (!command || command === "help" || parsed.flags.help || parsed.flags.h) {
    printText(HELP_TEXT);
    return;
  }

  const commandArgs = {
    positionals: rest,
    flags: parsed.flags,
  };

  switch (command) {
    case "auth":
      await runAuthCommand(commandArgs);
      return;
    case "customers":
      await runCustomersCommand(commandArgs);
      return;
    case "employees":
      await runEmployeesCommand(commandArgs);
      return;
    case "checklists":
      await runChecklistsCommand(commandArgs);
      return;
    case "estimates":
      await runEstimatesCommand(commandArgs);
      return;
    case "jobs":
      await runJobsCommand(commandArgs);
      return;
    case "job-types":
      await runJobTypesCommand(commandArgs);
      return;
    case "lead-sources":
      await runLeadSourcesCommand(commandArgs);
      return;
    case "leads":
      await runLeadsCommand(commandArgs);
      return;
    case "pipeline-statuses":
      await runPipelineStatusesCommand(commandArgs);
      return;
    case "price-forms":
      await runPriceFormsCommand(commandArgs);
      return;
    case "routes":
      await runRoutesCommand(commandArgs);
      return;
    case "company":
      await runCompanyCommand(commandArgs);
      return;
    case "invoices":
      await runInvoicesCommand(commandArgs);
      return;
    case "api":
      await runApiCommand(commandArgs);
      return;
    default:
      throw new Error(`Unknown command: ${command}\n\n${HELP_TEXT}`);
  }
}
