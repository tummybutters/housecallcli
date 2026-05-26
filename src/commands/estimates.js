import { readFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

import { loadResolvedConfig } from "../core/config.js";
import { HousecallClient } from "../core/client.js";
import { printJson } from "../core/output.js";
import { buildJobsListQuery } from "./jobs.js";
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

    case "approve-and-check-job": {
      const estimateId = nestedRest[0];

      if (!estimateId) {
        throw new Error(
          "Usage: housecall estimates options approve-and-check-job <estimate_id> --option-ids opt_1,opt_2 [--max-wait-ms 30000] [--poll-interval-ms 3000]",
        );
      }

      const body = await buildOptionIdsPayload(flags);
      const payload = await approveEstimateOptionsAndCheckJob(client, {
        estimateId,
        optionIds: body.option_ids,
        ...buildApproveAndCheckJobOptions(flags),
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

export function buildApproveAndCheckJobOptions(flags) {
  return {
    maxWaitMs: normalizeNonNegativeNumber(flags.max_wait_ms, 30000),
    pollIntervalMs: normalizeNonNegativeNumber(flags.poll_interval_ms, 3000),
    pageSize: normalizePositiveNumber(flags.page_size, 100),
    workStatus: csvOrUndefined(flags.work_status),
    expand: csvOrUndefined(flags.expand),
  };
}

export async function approveEstimateOptionsAndCheckJob(
  client,
  {
    estimateId,
    optionIds,
    maxWaitMs = 30000,
    pollIntervalMs = 3000,
    pageSize = 100,
    workStatus,
    expand,
    sleepImpl = sleep,
  },
) {
  const estimate = await client.request({
    method: "GET",
    path: `/estimates/${estimateId}`,
  });

  const customerId = extractEstimateCustomerId(estimate);
  const beforeJobs = customerId
    ? await listAllCustomerJobs(client, customerId, {
        pageSize,
        workStatus,
        expand,
      })
    : [];

  const approval = await client.request({
    method: "POST",
    path: "/estimates/options/approve",
    body: {
      option_ids: optionIds,
    },
  });

  if (!customerId) {
    return {
      estimate: summarizeEstimateForJobCheck(estimate),
      approval,
      job_check: {
        status: "unverifiable",
        reason: "estimate payload did not include a customer id",
        before_job_count: 0,
        after_job_count: 0,
        new_job_count: 0,
        new_jobs: [],
        poll_attempts: 0,
        max_poll_attempts: 0,
        poll_interval_ms: pollIntervalMs,
        max_wait_ms: maxWaitMs,
      },
    };
  }

  const maxPollAttempts = calculateMaxPollAttempts(maxWaitMs, pollIntervalMs);
  let latestJobs = beforeJobs;
  let newJobs = [];

  for (let attempt = 1; attempt <= maxPollAttempts; attempt += 1) {
    latestJobs = await listAllCustomerJobs(client, customerId, {
      pageSize,
      workStatus,
      expand,
    });
    newJobs = detectNewJobs(beforeJobs, latestJobs);

    if (newJobs.length > 0) {
      return {
        estimate: summarizeEstimateForJobCheck(estimate),
        approval,
        job_check: {
          status: "job_detected",
          customer_id: customerId,
          before_job_count: beforeJobs.length,
          after_job_count: latestJobs.length,
          new_job_count: newJobs.length,
          new_jobs: newJobs,
          poll_attempts: attempt,
          max_poll_attempts: maxPollAttempts,
          poll_interval_ms: pollIntervalMs,
          max_wait_ms: maxWaitMs,
        },
      };
    }

    if (attempt < maxPollAttempts && pollIntervalMs > 0) {
      await sleepImpl(pollIntervalMs);
    }
  }

  return {
    estimate: summarizeEstimateForJobCheck(estimate),
    approval,
    job_check: {
      status: "no_new_job_detected",
      customer_id: customerId,
      before_job_count: beforeJobs.length,
      after_job_count: latestJobs.length,
      new_job_count: 0,
      new_jobs: [],
      poll_attempts: maxPollAttempts,
      max_poll_attempts: maxPollAttempts,
      poll_interval_ms: pollIntervalMs,
      max_wait_ms: maxWaitMs,
    },
  };
}

export function extractEstimateCustomerId(estimate) {
  return estimate?.customer?.id ?? estimate?.customer_id ?? null;
}

export function detectNewJobs(beforeJobs, afterJobs) {
  const beforeIds = new Set((beforeJobs ?? []).map((job) => job?.id).filter(Boolean));
  return (afterJobs ?? []).filter((job) => job?.id && !beforeIds.has(job.id));
}

function summarizeEstimateForJobCheck(estimate) {
  return {
    id: estimate?.id ?? null,
    customer_id: extractEstimateCustomerId(estimate),
    address_id: estimate?.address?.id ?? estimate?.address_id ?? null,
    option_ids: (estimate?.options ?? []).map((option) => option?.id).filter(Boolean),
  };
}

async function listAllCustomerJobs(client, customerId, { pageSize, workStatus, expand }) {
  const jobs = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const payload = await client.request({
      method: "GET",
      path: "/jobs",
      query: buildJobsListQuery({
        customer_id: customerId,
        page,
        page_size: pageSize,
        work_status: workStatus,
        expand,
      }),
    });

    jobs.push(...(payload?.jobs ?? []));
    totalPages = normalizePositiveNumber(payload?.total_pages, 1);
    page += 1;
  }

  return jobs;
}

function calculateMaxPollAttempts(maxWaitMs, pollIntervalMs) {
  if (maxWaitMs <= 0) {
    return 1;
  }

  return Math.max(1, Math.floor(maxWaitMs / Math.max(pollIntervalMs, 1)) + 1);
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

function normalizeNonNegativeNumber(value, fallback) {
  const numericValue = toNumber(value);
  if (numericValue === undefined || numericValue < 0) {
    return fallback;
  }

  return numericValue;
}

function normalizePositiveNumber(value, fallback) {
  const numericValue = toNumber(value);
  if (numericValue === undefined || numericValue < 1) {
    return fallback;
  }

  return numericValue;
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
