import { loadResolvedConfig } from "../core/config.js";
import { HousecallClient } from "../core/client.js";
import { printJson } from "../core/output.js";
import {
  loadJsonInput,
  mergeObjects,
  pickDefined,
  splitCsv,
  toNumber,
} from "../core/utils.js";
import { validateDailyScheduleWindows } from "../core/schema-rules.js";

export async function runCompanyCommand(args) {
  const [action, ...rest] = args.positionals;
  const { resolved } = await loadResolvedConfig();
  const client = new HousecallClient(resolved);

  switch (action) {
    case "get": {
      const payload = await client.request({
        method: "GET",
        path: "/company",
      });
      printJson(payload);
      return;
    }

    case "schedule-windows": {
      await runCompanyScheduleWindowsCommand(client, rest, args.flags);
      return;
    }

    case "booking-windows": {
      await runCompanyBookingWindowsCommand(client, rest, args.flags);
      return;
    }

    default:
      throw new Error(`Unknown company command: ${action}`);
  }
}

async function runCompanyScheduleWindowsCommand(client, rest, flags) {
  const [action] = rest;

  switch (action) {
    case "get": {
      const payload = await client.request({
        method: "GET",
        path: "/company/schedule_availability",
      });
      printJson(payload);
      return;
    }

    case "update": {
      const body = await buildCompanyScheduleWindowsBody(flags);
      validateRequiredFields(
        body,
        ["availability_buffer_in_days", "daily_schedule_windows"],
        "company schedule windows update",
      );
      const payload = await client.request({
        method: "PUT",
        path: "/company/schedule_availability",
        body,
      });
      printJson(payload);
      return;
    }

    default:
      throw new Error(`Unknown company schedule-windows command: ${action}`);
  }
}

async function runCompanyBookingWindowsCommand(client, rest, flags) {
  const [action] = rest;

  if (action !== "list") {
    throw new Error(
      "Usage: housecall company booking-windows list [--show-for-days 7]",
    );
  }

  const payload = await client.request({
    method: "GET",
    path: "/company/schedule_availability/booking_windows",
    query: buildCompanyBookingWindowsQuery(flags),
  });
  printJson(payload);
}

export async function buildCompanyScheduleWindowsBody(flags) {
  const inputData = await loadJsonInput(flags.data);

  const body = mergeObjects(
    pickDefined({
      availability_buffer_in_days: toNumber(flags.availability_buffer_in_days),
      daily_schedule_windows: await loadJsonInput(flags.daily_schedule_windows),
    }),
    inputData,
  );

  validateDailyScheduleWindows(body.daily_schedule_windows);

  return body;
}

export function buildCompanyBookingWindowsQuery(flags) {
  return pickDefined({
    employee_ids: csvOrUndefined(flags.employee_ids ?? flags.employee_id),
    price_form_id: flags.price_form_id,
    service_duration: toNumber(flags.service_duration),
    service_id: flags.service_id,
    show_for_days: toNumber(flags.show_for_days),
    start_date: flags.start_date,
  });
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
