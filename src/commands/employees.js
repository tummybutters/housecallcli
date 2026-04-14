import { loadResolvedConfig } from "../core/config.js";
import { HousecallClient } from "../core/client.js";
import { printJson } from "../core/output.js";
import { pickDefined, splitCsv, toNumber } from "../core/utils.js";

export async function runEmployeesCommand(args) {
  const [action] = args.positionals;

  if (action !== "list") {
    throw new Error("Usage: housecall employees list");
  }

  const { resolved } = await loadResolvedConfig();
  const client = new HousecallClient(resolved);
  const payload = await client.request({
    method: "GET",
    path: "/employees",
    query: pickDefined({
      location_ids: splitCsv(args.flags.location_ids ?? args.flags.location_id),
      page: toNumber(args.flags.page),
      page_size: toNumber(args.flags.page_size),
      sort_by: args.flags.sort_by,
      sort_direction: args.flags.sort_direction,
    }),
  });

  printJson(payload);
}
