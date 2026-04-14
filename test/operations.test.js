import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPipelineStatusesListQuery,
  buildPipelineStatusUpdateBody,
} from "../src/commands/pipeline-statuses.js";
import { buildRoutesListQuery } from "../src/commands/routes.js";
import {
  buildCompanyBookingWindowsQuery,
  buildCompanyScheduleWindowsBody,
} from "../src/commands/company.js";
import { buildInvoicesListQuery } from "../src/commands/invoices.js";
import { buildLeadLineItemsQuery } from "../src/commands/leads.js";

test("buildPipelineStatusesListQuery normalizes pagination", () => {
  const query = buildPipelineStatusesListQuery({
    resource_type: "lead",
    page: "2",
    page_size: "25",
  });

  assert.deepEqual(query, {
    resource_type: "lead",
    page: 2,
    page_size: 25,
  });
});

test("buildPipelineStatusUpdateBody accepts inline flags", async () => {
  const body = await buildPipelineStatusUpdateBody({
    resource_type: "job",
    resource_id: "job_123",
    status_id: "kcs_789",
  });

  assert.deepEqual(body, {
    resource_type: "job",
    resource_id: "job_123",
    status_id: "kcs_789",
  });
});

test("buildPipelineStatusesListQuery rejects invalid resource type", () => {
  assert.throws(
    () =>
      buildPipelineStatusesListQuery({
        resource_type: "customer",
      }),
    /Allowed values/,
  );
});

test("buildPipelineStatusUpdateBody rejects invalid resource type", async () => {
  await assert.rejects(
    () =>
      buildPipelineStatusUpdateBody({
        resource_type: "customer",
        resource_id: "cus_123",
        status_id: "kcs_789",
      }),
    /Allowed values/,
  );
});

test("buildRoutesListQuery normalizes pagination", () => {
  const query = buildRoutesListQuery({
    date: "2026-04-14",
    page: "3",
    per_page: "20",
  });

  assert.deepEqual(query, {
    date: "2026-04-14",
    page: 3,
    per_page: 20,
  });
});

test("buildCompanyBookingWindowsQuery normalizes arrays and numbers", () => {
  const query = buildCompanyBookingWindowsQuery({
    employee_ids: "emp_1,emp_2",
    price_form_id: "pf_123",
    service_duration: "60",
    service_id: "svc_456",
    show_for_days: "7",
    start_date: "2026-04-15T00:00:00",
  });

  assert.deepEqual(query, {
    employee_ids: ["emp_1", "emp_2"],
    price_form_id: "pf_123",
    service_duration: 60,
    service_id: "svc_456",
    show_for_days: 7,
    start_date: "2026-04-15T00:00:00",
  });
});

test("buildCompanyScheduleWindowsBody parses nested json", async () => {
  const body = await buildCompanyScheduleWindowsBody({
    availability_buffer_in_days: "2",
    daily_schedule_windows:
      '[{"day_name":"Monday","schedule_windows":[{"start_time":"08:00","end_time":"17:00"}]}]',
  });

  assert.deepEqual(body, {
    availability_buffer_in_days: 2,
    daily_schedule_windows: [
      {
        day_name: "Monday",
        schedule_windows: [
          {
            start_time: "08:00",
            end_time: "17:00",
          },
        ],
      },
    ],
  });
});

test("buildCompanyScheduleWindowsBody requires day_name and times", async () => {
  await assert.rejects(
    () =>
      buildCompanyScheduleWindowsBody({
        data: JSON.stringify({
          availability_buffer_in_days: 2,
          daily_schedule_windows: [
            {
              schedule_windows: [
                {
                  start_time: "08:00",
                },
              ],
            },
          ],
        }),
      }),
    /day_name|end_time/,
  );
});

test("buildInvoicesListQuery normalizes filters", () => {
  const query = buildInvoicesListQuery({
    amount_due_max: "50000",
    amount_due_min: "1000",
    customer_uuid: "cus_1,cus_2",
    location_ids: "loc_1",
    page: "2",
    page_size: "50",
    payment_method: "credit_card,ach",
    sort_by: "due_at",
    sort_direction: "asc",
    status: "open,paid",
  });

  assert.deepEqual(query, {
    amount_due_max: 50000,
    amount_due_min: 1000,
    customer_uuid: ["cus_1", "cus_2"],
    location_ids: ["loc_1"],
    page: 2,
    page_size: 50,
    payment_method: ["credit_card", "ach"],
    sort_by: "due_at",
    sort_direction: "asc",
    status: ["open", "paid"],
  });
});

test("buildInvoicesListQuery rejects invalid invoice status", () => {
  assert.throws(
    () =>
      buildInvoicesListQuery({
        status: "open,not-real",
      }),
    /Allowed values/,
  );
});

test("buildLeadLineItemsQuery normalizes pagination", () => {
  const query = buildLeadLineItemsQuery({
    page: "2",
    page_size: "15",
  });

  assert.deepEqual(query, {
    page: 2,
    page_size: 15,
  });
});
