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
  assertAllowedValue,
  assertAllowedValues,
  assertConditionalRequirement,
  HOUSECALL_ENUMS,
  validateCreateAppointment,
  validatePriceFormsInLineItems,
} from "../core/schema-rules.js";

export async function runJobsCommand(args) {
  const [action, ...rest] = args.positionals;
  const { resolved } = await loadResolvedConfig();
  const client = new HousecallClient(resolved);

  switch (action) {
    case "list": {
      const payload = await client.request({
        method: "GET",
        path: "/jobs",
        query: buildJobsListQuery(args.flags),
      });
      printJson(payload);
      return;
    }

    case "get": {
      const jobId = rest[0];

      if (!jobId) {
        throw new Error("Usage: housecall jobs get <job_id>");
      }

      const payload = await client.request({
        method: "GET",
        path: `/jobs/${jobId}`,
        query: pickDefined({
          expand: csvOrUndefined(args.flags.expand),
        }),
      });
      printJson(payload);
      return;
    }

    case "create": {
      const body = await buildJobCreateBody(args.flags);
      validateRequiredFields(body, ["customer_id", "address_id"], "job");
      const payload = await client.request({
        method: "POST",
        path: "/jobs",
        body,
      });
      printJson(payload);
      return;
    }

    case "attachments": {
      await runJobAttachmentsCommand(client, rest, args.flags);
      return;
    }

    case "line-items": {
      await runJobLineItemsCommand(client, rest, args.flags);
      return;
    }

    case "schedule": {
      await runJobScheduleCommand(client, rest, args.flags);
      return;
    }

    case "appointments": {
      await runJobAppointmentsCommand(client, rest, args.flags);
      return;
    }

    case "dispatch": {
      await runJobDispatchCommand(client, rest, args.flags);
      return;
    }

    case "input-materials": {
      await runJobInputMaterialsCommand(client, rest, args.flags);
      return;
    }

    case "tags": {
      await runJobTagsCommand(client, rest, args.flags);
      return;
    }

    case "notes": {
      await runJobNotesCommand(client, rest, args.flags);
      return;
    }

    case "links": {
      await runJobLinksCommand(client, rest, args.flags);
      return;
    }

    case "invoices": {
      await runJobInvoicesCommand(client, rest);
      return;
    }

    case "lock": {
      const jobId = rest[0];

      if (!jobId) {
        throw new Error("Usage: housecall jobs lock <job_id>");
      }

      const payload = await client.request({
        method: "POST",
        path: `/jobs/${jobId}/lock`,
      });
      printJson(payload);
      return;
    }

    case "lock-range": {
      const body = await buildJobLockRangeBody(args.flags);
      validateRequiredFields(body, ["starting_at", "ending_at"], "job lock range");
      const payload = await client.request({
        method: "POST",
        path: "/jobs/lock",
        body,
      });
      printJson(payload);
      return;
    }

    default:
      throw new Error(`Unknown jobs command: ${action}`);
  }
}

export function buildJobsListQuery(flags) {
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

  assertAllowedValues(query.expand, HOUSECALL_ENUMS.jobExpand, "job expand");
  assertAllowedValues(
    query.work_status,
    HOUSECALL_ENUMS.jobWorkStatusFilter,
    "job work_status",
  );

  return query;
}

export async function buildJobDispatchBody(flags) {
  const inputData = await loadJsonInput(flags.data);
  const body = mergeObjects(
    pickDefined({
      dispatched_employees: buildDispatchedEmployees(
        flags.employee_ids ?? flags.employee_id,
      ),
    }),
    inputData,
  );

  validateRequiredFields(body, ["dispatched_employees"], "job dispatch");
  return body;
}

export async function buildJobLockRangeBody(flags) {
  const inputData = await loadJsonInput(flags.data);
  return mergeObjects(
    pickDefined({
      starting_at: flags.starting_at,
      ending_at: flags.ending_at,
    }),
    inputData,
  );
}

async function runJobAttachmentsCommand(client, rest, flags) {
  const [action, jobId] = rest;

  if (action !== "create" || !jobId) {
    throw new Error(
      "Usage: housecall jobs attachments create <job_id> --file ./path/to/file",
    );
  }

  const filePath = flags.file;

  if (!filePath) {
    throw new Error("Job attachment upload requires --file <path>.");
  }

  const fileBytes = await readFile(filePath);
  const formData = new FormData();
  formData.append("file", new Blob([fileBytes]), path.basename(filePath));

  const payload = await client.request({
    method: "POST",
    path: `/jobs/${jobId}/attachments`,
    body: formData,
  });
  printJson(payload);
}

async function runJobLineItemsCommand(client, rest, flags) {
  const [action, jobId, lineItemId] = rest;

  switch (action) {
    case "list": {
      if (!jobId) {
        throw new Error("Usage: housecall jobs line-items list <job_id>");
      }

      const payload = await client.request({
        method: "GET",
        path: `/jobs/${jobId}/line_items`,
      });
      printJson(payload);
      return;
    }

    case "create": {
      if (!jobId) {
        throw new Error(
          "Usage: housecall jobs line-items create <job_id> --data @payload.json",
        );
      }

      const body = await buildJobLineItemBody(flags);
      validateRequiredFields(body, ["name"], "job line item");
      const payload = await client.request({
        method: "POST",
        path: `/jobs/${jobId}/line_items`,
        body,
      });
      printJson(payload);
      return;
    }

    case "bulk-update": {
      if (!jobId) {
        throw new Error(
          "Usage: housecall jobs line-items bulk-update <job_id> --data @payload.json",
        );
      }

      const body = await buildJobLineItemsBulkBody(flags);
      validateRequiredFields(body, ["line_items"], "job line item bulk update");
      const payload = await client.request({
        method: "PUT",
        path: `/jobs/${jobId}/line_items/bulk_update`,
        body,
      });
      printJson(payload);
      return;
    }

    case "update": {
      if (!jobId || !lineItemId) {
        throw new Error(
          "Usage: housecall jobs line-items update <job_id> <line_item_id> --data @payload.json",
        );
      }

      const body = await buildJobLineItemBody(flags);
      validateRequiredFields(body, ["name"], "job line item");
      const payload = await client.request({
        method: "PUT",
        path: `/jobs/${jobId}/line_items/${lineItemId}`,
        body,
      });
      printJson(payload);
      return;
    }

    case "delete": {
      if (!jobId || !lineItemId) {
        throw new Error(
          "Usage: housecall jobs line-items delete <job_id> <line_item_id>",
        );
      }

      const payload = await client.request({
        method: "DELETE",
        path: `/jobs/${jobId}/line_items/${lineItemId}`,
      });
      printJson(payload ?? { id: lineItemId, deleted: true });
      return;
    }

    default:
      throw new Error(`Unknown jobs line-items command: ${action}`);
  }
}

async function runJobScheduleCommand(client, rest, flags) {
  const [action, jobId] = rest;

  switch (action) {
    case "update": {
      if (!jobId) {
        throw new Error(
          "Usage: housecall jobs schedule update <job_id> --data @payload.json",
        );
      }

      const body = await buildJobScheduleBody(flags);
      validateRequiredFields(body, ["start_time"], "job schedule");
      const payload = await client.request({
        method: "PUT",
        path: `/jobs/${jobId}/schedule`,
        body,
      });
      printJson(payload);
      return;
    }

    case "delete": {
      if (!jobId) {
        throw new Error("Usage: housecall jobs schedule delete <job_id>");
      }

      const payload = await client.request({
        method: "DELETE",
        path: `/jobs/${jobId}/schedule`,
      });
      printJson(payload ?? { object: "schedule", deleted: true });
      return;
    }

    default:
      throw new Error(`Unknown jobs schedule command: ${action}`);
  }
}

async function runJobAppointmentsCommand(client, rest, flags) {
  const [action, jobId, appointmentId] = rest;

  switch (action) {
    case "list": {
      if (!jobId) {
        throw new Error(
          "Usage: housecall jobs appointments list <job_id>",
        );
      }

      const payload = await client.request({
        method: "GET",
        path: `/jobs/${jobId}/appointments`,
      });
      printJson(payload);
      return;
    }

    case "create": {
      if (!jobId) {
        throw new Error(
          "Usage: housecall jobs appointments create <job_id> --data @payload.json",
        );
      }

      const body = await buildJobAppointmentBody(flags);
      const payload = await client.request({
        method: "POST",
        path: `/jobs/${jobId}/appointments`,
        body,
      });
      printJson(payload);
      return;
    }

    case "update": {
      if (!jobId || !appointmentId) {
        throw new Error(
          "Usage: housecall jobs appointments update <job_id> <appointment_id> --data @payload.json",
        );
      }

      const body = await buildJobAppointmentBody(flags);
      const payload = await client.request({
        method: "PUT",
        path: `/jobs/${jobId}/appointments/${appointmentId}`,
        body,
      });
      printJson(payload);
      return;
    }

    case "delete": {
      if (!jobId || !appointmentId) {
        throw new Error(
          "Usage: housecall jobs appointments delete <job_id> <appointment_id>",
        );
      }

      const payload = await client.request({
        method: "DELETE",
        path: `/jobs/${jobId}/appointments/${appointmentId}`,
      });
      printJson(payload ?? { id: appointmentId, deleted: true });
      return;
    }

    default:
      throw new Error(`Unknown jobs appointments command: ${action}`);
  }
}

async function runJobDispatchCommand(client, rest, flags) {
  const jobId = rest[0];

  if (!jobId) {
    throw new Error(
      "Usage: housecall jobs dispatch <job_id> --employee-ids emp_1,emp_2",
    );
  }

  const body = await buildJobDispatchBody(flags);
  const payload = await client.request({
    method: "PUT",
    path: `/jobs/${jobId}/dispatch`,
    body,
  });
  printJson(payload);
}

async function runJobInvoicesCommand(client, rest) {
  const [action, jobId] = rest;

  if (action !== "list" || !jobId) {
    throw new Error("Usage: housecall jobs invoices list <job_id>");
  }

  const payload = await client.request({
    method: "GET",
    path: `/jobs/${jobId}/invoices`,
  });
  printJson(payload);
}

async function runJobInputMaterialsCommand(client, rest, flags) {
  const [action, jobId] = rest;

  switch (action) {
    case "list": {
      if (!jobId) {
        throw new Error(
          "Usage: housecall jobs input-materials list <job_id>",
        );
      }

      const payload = await client.request({
        method: "GET",
        path: `/jobs/${jobId}/job_input_materials`,
      });
      printJson(payload);
      return;
    }

    case "bulk-update": {
      if (!jobId) {
        throw new Error(
          "Usage: housecall jobs input-materials bulk-update <job_id> --data @payload.json",
        );
      }

      const body = await buildJobInputMaterialsBody(flags);
      validateRequiredFields(
        body,
        ["job_input_materials"],
        "job input materials bulk update",
      );
      const payload = await client.request({
        method: "PUT",
        path: `/jobs/${jobId}/job_input_materials/bulk_update`,
        body,
      });
      printJson(payload);
      return;
    }

    default:
      throw new Error(`Unknown jobs input-materials command: ${action}`);
  }
}

async function runJobTagsCommand(client, rest, flags) {
  const [action, jobId, tagIdFromArg] = rest;

  switch (action) {
    case "add": {
      if (!jobId) {
        throw new Error(
          "Usage: housecall jobs tags add <job_id> <tag_id>",
        );
      }

      const inputData = await loadJsonInput(flags.data);
      const body = mergeObjects(
        pickDefined({
          tag_id: tagIdFromArg ?? flags.tag_id,
        }),
        inputData,
      );

      validateRequiredFields(body, ["tag_id"], "job tag");
      const payload = await client.request({
        method: "POST",
        path: `/jobs/${jobId}/tags`,
        body,
      });
      printJson(payload);
      return;
    }

    case "remove": {
      const tagId = tagIdFromArg ?? flags.tag_id;

      if (!jobId || !tagId) {
        throw new Error(
          "Usage: housecall jobs tags remove <job_id> <tag_id>",
        );
      }

      const payload = await client.request({
        method: "DELETE",
        path: `/jobs/${jobId}/tags/${tagId}`,
      });
      printJson(payload);
      return;
    }

    default:
      throw new Error(`Unknown jobs tags command: ${action}`);
  }
}

async function runJobNotesCommand(client, rest, flags) {
  const [action, jobId, noteId] = rest;

  switch (action) {
    case "create": {
      if (!jobId) {
        throw new Error(
          "Usage: housecall jobs notes create <job_id> --content 'note text'",
        );
      }

      const inputData = await loadJsonInput(flags.data);
      const body = mergeObjects(
        pickDefined({
          content: flags.content,
        }),
        inputData,
      );

      validateRequiredFields(body, ["content"], "job note");
      const payload = await client.request({
        method: "POST",
        path: `/jobs/${jobId}/notes`,
        body,
      });
      printJson(payload);
      return;
    }

    case "delete": {
      if (!jobId || !noteId) {
        throw new Error(
          "Usage: housecall jobs notes delete <job_id> <note_id>",
        );
      }

      const payload = await client.request({
        method: "DELETE",
        path: `/jobs/${jobId}/notes/${noteId}`,
      });
      printJson(payload ?? { id: noteId, deleted: true });
      return;
    }

    default:
      throw new Error(`Unknown jobs notes command: ${action}`);
  }
}

async function runJobLinksCommand(client, rest, flags) {
  const [action, jobId] = rest;

  if (action !== "create" || !jobId) {
    throw new Error(
      "Usage: housecall jobs links create <job_id> --title <title> --url <url>",
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

  validateRequiredFields(body, ["title", "url"], "job link");
  const payload = await client.request({
    method: "POST",
    path: `/jobs/${jobId}/links`,
    body,
  });
  printJson(payload);
}

export async function buildJobCreateBody(flags) {
  const inputData = await loadJsonInput(flags.data);

  const body = mergeObjects(
    pickDefined({
      invoice_number: toNumber(flags.invoice_number),
      customer_id: flags.customer_id,
      address_id: flags.address_id,
      schedule: await loadOptionalJsonValue(flags.schedule),
      assigned_employee_ids: csvOrUndefined(
        flags.assigned_employee_ids ?? flags.assigned_employee_id,
      ),
      line_items: await loadOptionalJsonValue(flags.line_items),
      tags: csvOrUndefined(flags.tags ?? flags.tag),
      lead_source: flags.lead_source,
      notes: flags.notes,
      job_fields: await loadOptionalJsonValue(flags.job_fields),
    }),
    inputData,
  );

  assertConditionalRequirement(
    body.schedule?.anytime === true,
    body.schedule?.anytime_start_date,
    "Job schedule.anytime_start_date is required when schedule.anytime is true.",
  );
  validatePriceFormsInLineItems(body.line_items, "job.line_items");

  return body;
}

export async function buildJobLineItemBody(flags) {
  const inputData = await loadJsonInput(flags.data);

  const body = mergeObjects(
    pickDefined({
      service_item_id: flags.service_item_id,
      service_item_type: flags.service_item_type,
      name: flags.name,
      unit_price: toNumber(flags.unit_price),
      unit_cost: toNumber(flags.unit_cost),
      quantity: toNumber(flags.quantity),
      kind: flags.kind,
      taxable: toBoolean(flags.taxable),
      description: flags.description,
    }),
    inputData,
  );

  assertAllowedValue(
    body.kind,
    HOUSECALL_ENUMS.lineItemKind,
    "job line item kind",
  );
  assertAllowedValue(
    body.service_item_type,
    HOUSECALL_ENUMS.serviceItemType,
    "job line item service_item_type",
  );

  return body;
}

export async function buildJobLineItemsBulkBody(flags) {
  const inputData = await loadJsonInput(flags.data);

  const body = mergeObjects(
    pickDefined({
      line_items: await loadOptionalJsonValue(flags.line_items),
      append_line_items: toBoolean(flags.append_line_items),
    }),
    inputData,
  );

  for (const lineItem of body.line_items ?? []) {
    assertAllowedValue(
      lineItem.kind,
      HOUSECALL_ENUMS.lineItemKind,
      "job bulk line item kind",
    );
    assertAllowedValue(
      lineItem.service_item_type,
      HOUSECALL_ENUMS.serviceItemType,
      "job bulk line item service_item_type",
    );
  }

  return body;
}

async function buildJobScheduleBody(flags) {
  const inputData = await loadJsonInput(flags.data);

  return mergeObjects(
    pickDefined({
      start_time: flags.start_time,
      end_time: flags.end_time,
      arrival_window_in_minutes: toNumber(flags.arrival_window_in_minutes),
      notify: toBoolean(flags.notify),
      notify_pro: toBoolean(flags.notify_pro),
      expand: csvOrUndefined(flags.expand),
      dispatched_employees: buildDispatchedEmployees(
        flags.employee_ids ?? flags.employee_id,
      ),
    }),
    inputData,
  );
}

export async function buildJobAppointmentBody(flags) {
  const inputData = await loadJsonInput(flags.data);

  const body = mergeObjects(
    pickDefined({
      start_time: flags.start_time,
      end_time: flags.end_time,
      arrival_window_minutes: toNumber(flags.arrival_window_minutes),
      dispatched_employees_ids: csvOrUndefined(
        flags.dispatched_employees_ids ??
          flags.dispatched_employee_ids ??
          flags.employee_ids ??
          flags.employee_id,
      ),
    }),
    inputData,
  );

  validateCreateAppointment(body, "job appointment");

  return body;
}

async function buildJobInputMaterialsBody(flags) {
  const inputData = await loadJsonInput(flags.data);

  return mergeObjects(
    pickDefined({
      job_input_materials: await loadOptionalJsonValue(flags.job_input_materials),
    }),
    inputData,
  );
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
