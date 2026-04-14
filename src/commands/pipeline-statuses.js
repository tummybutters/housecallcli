import { loadResolvedConfig } from "../core/config.js";
import { HousecallClient } from "../core/client.js";
import { printJson } from "../core/output.js";
import {
  loadJsonInput,
  mergeObjects,
  pickDefined,
  toNumber,
} from "../core/utils.js";
import {
  assertAllowedValue,
  HOUSECALL_ENUMS,
} from "../core/schema-rules.js";

export async function runPipelineStatusesCommand(args) {
  const [action] = args.positionals;
  const { resolved } = await loadResolvedConfig();
  const client = new HousecallClient(resolved);

  switch (action) {
    case "list": {
      const query = buildPipelineStatusesListQuery(args.flags);
      validateRequiredFields(query, ["resource_type"], "pipeline status list");
      const payload = await client.request({
        method: "GET",
        path: "/pipeline/statuses",
        query,
      });
      printJson(payload);
      return;
    }

    case "update": {
      const body = await buildPipelineStatusUpdateBody(args.flags);
      validateRequiredFields(
        body,
        ["resource_type", "resource_id", "status_id"],
        "pipeline status update",
      );
      const payload = await client.request({
        method: "PUT",
        path: "/pipeline/statuses",
        body,
      });
      printJson(payload);
      return;
    }

    default:
      throw new Error(`Unknown pipeline-statuses command: ${action}`);
  }
}

export function buildPipelineStatusesListQuery(flags) {
  const query = pickDefined({
    resource_type: flags.resource_type,
    page: toNumber(flags.page),
    page_size: toNumber(flags.page_size),
  });

  assertAllowedValue(
    query.resource_type,
    HOUSECALL_ENUMS.pipelineResourceType,
    "pipeline resource_type",
  );

  return query;
}

export async function buildPipelineStatusUpdateBody(flags) {
  const inputData = await loadJsonInput(flags.data);

  const body = mergeObjects(
    pickDefined({
      resource_type: flags.resource_type,
      resource_id: flags.resource_id,
      status_id: flags.status_id,
    }),
    inputData,
  );

  assertAllowedValue(
    body.resource_type,
    HOUSECALL_ENUMS.pipelineResourceType,
    "pipeline resource_type",
  );

  return body;
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
