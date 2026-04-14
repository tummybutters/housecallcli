import { loadResolvedConfig } from "../core/config.js";
import { HousecallClient } from "../core/client.js";
import { printJson } from "../core/output.js";
import { loadJsonInput, mergeObjects, pickDefined } from "../core/utils.js";

export async function runJobTypesCommand(args) {
  const [action, ...rest] = args.positionals;
  const { resolved } = await loadResolvedConfig();
  const client = new HousecallClient(resolved);

  switch (action) {
    case "list": {
      const payload = await client.request({
        method: "GET",
        path: "/job_fields/job_types",
        query: buildJobTypesListQuery(args.flags),
      });
      printJson(payload);
      return;
    }

    case "create": {
      const body = await buildJobTypeBody(args.flags);
      validateRequiredFields(body, ["name"], "job type");
      const payload = await client.request({
        method: "POST",
        path: "/job_fields/job_types",
        body,
      });
      printJson(payload);
      return;
    }

    case "update": {
      const jobTypeId = rest[0];

      if (!jobTypeId) {
        throw new Error(
          "Usage: housecall job-types update <job_type_id> --name \"Service Type\"",
        );
      }

      const body = await buildJobTypeBody(args.flags);
      validateRequiredFields(body, ["name"], "job type");
      const payload = await client.request({
        method: "PUT",
        path: `/job_fields/job_types/${jobTypeId}`,
        body,
      });
      printJson(payload);
      return;
    }

    default:
      throw new Error(`Unknown job-types command: ${action}`);
  }
}

export function buildJobTypesListQuery(flags) {
  return pickDefined({
    name: flags.name,
  });
}

export async function buildJobTypeBody(flags) {
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
