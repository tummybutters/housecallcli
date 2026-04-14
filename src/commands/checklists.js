import { loadResolvedConfig } from "../core/config.js";
import { HousecallClient } from "../core/client.js";
import { printJson } from "../core/output.js";
import { pickDefined, splitCsv, toNumber } from "../core/utils.js";

export async function runChecklistsCommand(args) {
  const [action] = args.positionals;

  if (action !== "list") {
    throw new Error("Usage: housecall checklists list");
  }

  const query = pickDefined({
    estimate_uuids: splitCsv(args.flags.estimate_uuids ?? args.flags.estimate_uuid),
    job_uuids: splitCsv(args.flags.job_uuids ?? args.flags.job_uuid),
    page: toNumber(args.flags.page),
    per_page: toNumber(args.flags.per_page),
  });

  if (!query.job_uuids?.length && !query.estimate_uuids?.length) {
    throw new Error(
      "Checklist lookups require at least one --job-uuid or --estimate-uuid.",
    );
  }

  const { resolved } = await loadResolvedConfig();
  const client = new HousecallClient(resolved);
  const payload = await client.request({
    method: "GET",
    path: "/checklists",
    query,
  });

  printJson(payload);
}
