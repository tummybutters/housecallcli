import { readFile } from "node:fs/promises";
import path from "node:path";

import { loadResolvedConfig } from "../core/config.js";
import { HousecallClient } from "../core/client.js";
import { printJson } from "../core/output.js";
import {
  loadJsonInput,
  loadOptionalJsonValue,
  mergeObjects,
  pickDefined,
  splitCsv,
  toBoolean,
  toNumber,
} from "../core/utils.js";
import {
  assertAllowedValues,
  HOUSECALL_ENUMS,
  validatePriceFormsInLineItems,
  validateTaxConfiguration,
} from "../core/schema-rules.js";

export async function runEstimatesCommand(args) {
  const [action, ...rest] = args.positionals;
  const { resolved } = await loadResolvedConfig();
  const client = new HousecallClient(resolved);

  switch (action) {
    case "list": {
      const payload = await client.request({
        method: "GET",
        path: "/estimates",
        query: buildEstimateListQuery(args.flags),
      });
      printJson(payload);
      return;
    }

    case "get": {
      const estimateId = rest[0];

      if (!estimateId) {
        throw new Error("Usage: housecall estimates get <estimate_id>");
      }

      const payload = await client.request({
        method: "GET",
        path: `/estimates/${estimateId}`,
        query: pickDefined({
          expand: csvOrUndefined(args.flags.expand),
        }),
      });
      printJson(payload);
      return;
    }

    case "create": {
      const body = await buildEstimateCreateBody(args.flags);
      const payload = await client.request({
        method: "POST",
        path: "/estimates",
        body,
      });
      printJson(payload);
      return;
    }

    case "options": {
      await runEstimateOptionsCommand(client, rest, args.flags);
      return;
    }

    default:
      throw new Error(`Unknown estimates command: ${action}`);
  }
}

export function buildEstimateListQuery(flags) {
  const query = pickDefined({
    customer_id: flags.customer_id,
    employee_ids: csvOrUndefined(flags.employee_ids ?? flags.employee_id),
    expand: csvOrUndefined(flags.expand),
    location_ids: csvOrUndefined(flags.location_ids ?? flags.location_id),
    page: toNumber(flags.page),
    page_size: toNumber(flags.page_size),
    scheduled_end_max: flags.scheduled_end_max,
    scheduled_end_min: flags.scheduled_end_min,
    scheduled_start_max: flags.scheduled_start_max,
    scheduled_start_min: flags.scheduled_start_min,
    sort_by: flags.sort_by,
    sort_direction: flags.sort_direction,
    work_status: csvOrUndefined(flags.work_status),
  });

  assertAllowedValues(
    query.expand,
    HOUSECALL_ENUMS.estimateExpand,
    "estimate expand",
  );
  assertAllowedValues(
    query.work_status,
    HOUSECALL_ENUMS.jobWorkStatusFilter,
    "estimate work_status",
  );

  return query;
}

async function runEstimateOptionsCommand(client, rest, flags) {
  const [action, ...nestedRest] = rest;

  switch (action) {
    case "create": {
      const estimateId = nestedRest[0];

      if (!estimateId) {
        throw new Error(
          "Usage: housecall estimates options create <estimate_id> [--data @payload.json]",
        );
      }

      const body = await buildEstimateOptionBody(flags);
      validateRequiredFields(body, ["name"], "estimate option");
      const payload = await client.request({
        method: "POST",
        path: `/estimates/${estimateId}/options`,
        body,
      });
      printJson(payload);
      return;
    }

    case "attachments": {
      await runEstimateOptionAttachmentsCommand(client, nestedRest, flags);
      return;
    }

    case "line-items": {
      await runEstimateOptionLineItemsCommand(client, nestedRest, flags);
      return;
    }

    case "links": {
      await runEstimateOptionLinksCommand(client, nestedRest, flags);
      return;
    }

    case "schedule": {
      await runEstimateOptionScheduleCommand(client, nestedRest, flags);
      return;
    }

    case "notes": {
      await runEstimateOptionNotesCommand(client, nestedRest, flags);
      return;
    }

    case "approve":
    case "decline": {
      const body = await buildOptionIdsPayload(flags);
      const payload = await client.request({
        method: "POST",
        path: `/estimates/options/${action}`,
        body,
      });
      printJson(payload);
      return;
    }

    default:
      throw new Error(`Unknown estimates options command: ${action}`);
  }
}

async function runEstimateOptionAttachmentsCommand(client, rest, flags) {
  const [action, estimateId, optionId] = rest;

  if (action !== "create") {
    throw new Error(
      "Usage: housecall estimates options attachments create <estimate_id> <option_id> --file ./path/to/file",
    );
  }

  if (!estimateId || !optionId) {
    throw new Error(
      "Usage: housecall estimates options attachments create <estimate_id> <option_id> --file ./path/to/file",
    );
  }

  const filePath = flags.file;

  if (!filePath) {
    throw new Error("Estimate option attachment upload requires --file <path>.");
  }

  const fileBytes = await readFile(filePath);
  const formData = new FormData();
  formData.append("file", new Blob([fileBytes]), path.basename(filePath));

  const payload = await client.request({
    method: "POST",
    path: `/estimates/${estimateId}/options/${optionId}/attachments`,
    body: formData,
  });
  printJson(payload);
}

async function runEstimateOptionLineItemsCommand(client, rest, flags) {
  const [action, estimateId, optionId] = rest;

  switch (action) {
    case "list": {
      if (!estimateId || !optionId) {
        throw new Error(
          "Usage: housecall estimates options line-items list <estimate_id> <option_id>",
        );
      }

      const payload = await client.request({
        method: "GET",
        path: `/estimates/${estimateId}/options/${optionId}/line_items`,
        query: pickDefined({
          page: toNumber(flags.page),
          page_size: toNumber(flags.page_size),
        }),
      });
      printJson(payload);
      return;
    }

    case "bulk-update": {
      if (!estimateId || !optionId) {
        throw new Error(
          "Usage: housecall estimates options line-items bulk-update <estimate_id> <option_id> --data @payload.json",
        );
      }

      const inputData = await loadJsonInput(flags.data);
      const body = mergeObjects(
        pickDefined({
          line_items: await loadOptionalJsonValue(flags.line_items),
        }),
        inputData,
      );

      validateRequiredFields(body, ["line_items"], "estimate option line item bulk update");
      const payload = await client.request({
        method: "PUT",
        path: `/estimates/${estimateId}/options/${optionId}/line_items/bulk_update`,
        body,
      });
      printJson(payload);
      return;
    }

    default:
      throw new Error(`Unknown estimates options line-items command: ${action}`);
  }
}

async function runEstimateOptionLinksCommand(client, rest, flags) {
  const [action, estimateId, optionId] = rest;

  if (action !== "create" || !estimateId || !optionId) {
    throw new Error(
      "Usage: housecall estimates options links create <estimate_id> <option_id> --title <title> --url <url>",
    );
  }

  const inputData = await loadJsonInput(flags.data);
  const body = mergeObjects(
    pickDefined({
      title: flags.title,
      url: flags.url,
    }),
    inputData,
  );

  validateRequiredFields(body, ["title", "url"], "estimate option link");
  const payload = await client.request({
    method: "POST",
    path: `/estimates/${estimateId}/options/${optionId}/links`,
    body,
  });
  printJson(payload);
}

async function runEstimateOptionScheduleCommand(client, rest, flags) {
  const [action, estimateId, optionId] = rest;

  if (action !== "update" || !estimateId || !optionId) {
    throw new Error(
      "Usage: housecall estimates options schedule update <estimate_id> <option_id> --data @payload.json",
    );
  }

  const inputData = await loadJsonInput(flags.data);
  const body = mergeObjects(
    pickDefined({
      start_time: flags.start_time,
      end_time: flags.end_time,
      arrival_window_in_minutes: toNumber(flags.arrival_window_in_minutes),
      notify: toBoolean(flags.notify),
      notify_pro: toBoolean(flags.notify_pro),
      expand: csvOrUndefined(flags.expand),
      dispatched_employees: buildDispatchedEmployees(flags.employee_ids),
    }),
    inputData,
  );

  validateRequiredFields(body, ["start_time"], "estimate option schedule");
  const payload = await client.request({
    method: "PUT",
    path: `/estimates/${estimateId}/options/${optionId}/schedule`,
    body,
  });
  printJson(payload);
}

async function runEstimateOptionNotesCommand(client, rest, flags) {
  const [action, estimateId, optionId, noteId] = rest;

  switch (action) {
    case "create": {
      if (!estimateId || !optionId) {
        throw new Error(
          "Usage: housecall estimates options notes create <estimate_id> <option_id> --content 'note'",
        );
      }

      const inputData = await loadJsonInput(flags.data);
      const body = mergeObjects(
        pickDefined({
          content: flags.content,
        }),
        inputData,
      );

      validateRequiredFields(body, ["content"], "estimate option note");
      const payload = await client.request({
        method: "POST",
        path: `/estimates/${estimateId}/options/${optionId}/notes`,
        body,
      });
      printJson(payload);
      return;
    }

    case "delete": {
      if (!estimateId || !optionId || !noteId) {
        throw new Error(
          "Usage: housecall estimates options notes delete <estimate_id> <option_id> <note_id>",
        );
      }

      const payload = await client.request({
        method: "DELETE",
        path: `/estimates/${estimateId}/options/${optionId}/notes/${noteId}`,
      });
      printJson(payload ?? { ok: true });
      return;
    }

    default:
      throw new Error(`Unknown estimates options notes command: ${action}`);
  }
}

export async function buildEstimateCreateBody(flags) {
  const inputData = await loadJsonInput(flags.data);

  const body = mergeObjects(
    pickDefined({
      estimate_number: toNumber(flags.estimate_number),
      note: flags.note,
      message: flags.message,
      customer_id: flags.customer_id,
      assigned_employee_ids: csvOrUndefined(
        flags.assigned_employee_ids ?? flags.assigned_employee_id,
      ),
      address_id: flags.address_id,
      lead_source: flags.lead_source,
      address: await loadOptionalJsonValue(flags.address),
      options: await loadOptionalJsonValue(flags.options),
      tax: await loadOptionalJsonValue(flags.tax),
      schedule: await loadOptionalJsonValue(flags.schedule),
      estimate_fields: await loadOptionalJsonValue(flags.estimate_fields),
    }),
    inputData,
  );

  validateTaxConfiguration(body.tax, "estimate tax");

  for (const [optionIndex, option] of (body.options ?? []).entries()) {
    validatePriceFormsInLineItems(
      option?.line_items,
      `estimate.options[${optionIndex}].line_items`,
    );
  }

  return body;
}

export async function buildEstimateOptionBody(flags) {
  const inputData = await loadJsonInput(flags.data);

  const body = mergeObjects(
    pickDefined({
      name: flags.name,
      line_items: await loadOptionalJsonValue(flags.line_items),
      tax: await loadOptionalJsonValue(flags.tax),
    }),
    inputData,
  );

  validateTaxConfiguration(body.tax, "estimate option tax");

  return body;
}

export async function buildOptionIdsPayload(flags) {
  const inputData = await loadJsonInput(flags.data);
  const body = mergeObjects(
    pickDefined({
      option_ids: csvOrUndefined(flags.option_ids ?? flags.option_id),
    }),
    inputData,
  );

  validateRequiredFields(body, ["option_ids"], "estimate option approval payload");
  return body;
}

function buildDispatchedEmployees(value) {
  const employeeIds = csvOrUndefined(value) ?? [];

  if (employeeIds.length === 0) {
    return undefined;
  }

  return employeeIds.map((employeeId) => ({ employee_id: employeeId }));
}

function csvOrUndefined(value) {
  const items = splitCsv(value);
  return items.length > 0 ? items : undefined;
}

function validateRequiredFields(body, fields, label) {
  const missingFields = fields.filter((field) => {
    const value = body?.[field];

    if (Array.isArray(value)) {
      return value.length === 0;
    }

    return value === undefined || value === null || value === "";
  });

  if (missingFields.length > 0) {
    throw new Error(`Missing required ${label} fields: ${missingFields.join(", ")}`);
  }
}
