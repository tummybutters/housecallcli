import { loadResolvedConfig } from "../core/config.js";
import { HousecallClient } from "../core/client.js";
import { printJson } from "../core/output.js";
import { pickDefined, toNumber } from "../core/utils.js";

export async function runRoutesCommand(args) {
  const [action] = args.positionals;

  if (action !== "list") {
    throw new Error("Usage: housecall routes list [--date YYYY-MM-DD]");
  }

  const { resolved } = await loadResolvedConfig();
  const client = new HousecallClient(resolved);
  const payload = await client.request({
    method: "GET",
    path: "/routes",
    query: buildRoutesListQuery(args.flags),
  });

  printJson(payload);
}

export function buildRoutesListQuery(flags) {
  return pickDefined({
    date: flags.date,
    page: toNumber(flags.page),
    per_page: toNumber(flags.per_page),
  });
}
