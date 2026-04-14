import { loadResolvedConfig } from "../core/config.js";
import { HousecallClient } from "../core/client.js";
import { printJson } from "../core/output.js";
import {
  loadJsonInput,
  mergeObjects,
  pickDefined,
  toNumber,
} from "../core/utils.js";

export async function runLeadSourcesCommand(args) {
  const [action, ...rest] = args.positionals;
  const { resolved } = await loadResolvedConfig();
  const client = new HousecallClient(resolved);

  switch (action) {
    case "list": {
      const payload = await client.request({
        method: "GET",
        path: "/lead_sources",
        query: buildLeadSourcesListQuery(args.flags),
      });
      printJson(payload);
      return;
    }

    case "create": {
      const body = await buildLeadSourceBody(args.flags);
      validateRequiredFields(body, ["name"], "lead source");
      const payload = await client.request({
        method: "POST",
        path: "/lead_sources",
        body,
      });
      printJson(payload);
      return;
    }

    case "update": {
      const leadSourceId = rest[0];

      if (!leadSourceId) {
        throw new Error(
          "Usage: housecall lead-sources update <lead_source_id> --name \"Referral\"",
        );
      }

      const body = await buildLeadSourceBody(args.flags);
      validateRequiredFields(body, ["name"], "lead source");
      const payload = await client.request({
        method: "PUT",
        path: `/lead_sources/${leadSourceId}`,
        body,
      });
      printJson(payload);
      return;
    }

    default:
      throw new Error(`Unknown lead-sources command: ${action}`);
  }
}

export function buildLeadSourcesListQuery(flags) {
  return pickDefined({
    page: toNumber(flags.page),
    page_size: toNumber(flags.page_size),
    q: flags.q,
    sort_direction: flags.sort_direction,
  });
}

export async function buildLeadSourceBody(flags) {
  const inputData = await loadJsonInput(flags.data);

  return mergeObjects(
    pickDefined({
      name: flags.name,
    }),
    inputData,
  );
}

function validateRequiredFields(body, fields, label) {
  const missingFields = fields.filter((field) => {
    const value = body?.[field];
    return value === undefined || value === null || value === "";
  });

  if (missingFields.length > 0) {
    throw new Error(`Missing required ${label} fields: ${missingFields.join(", ")}`);
  }
}
