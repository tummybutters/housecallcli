import test from "node:test";
import assert from "node:assert/strict";

import {
  buildJobCreateBody,
  buildJobAppointmentBody,
  buildJobsListQuery,
  buildJobDispatchBody,
  buildJobLineItemBody,
  buildJobLockRangeBody,
} from "../src/commands/jobs.js";

test("buildJobsListQuery normalizes arrays and numbers", () => {
  const query = buildJobsListQuery({
    customer_id: "cus_123",
    employee_ids: "emp_1,emp_2",
    expand: "attachments,appointments",
    location_ids: "loc_1",
    page: "2",
    page_size: "50",
    work_status: "scheduled,in_progress",
  });

  assert.deepEqual(query, {
    customer_id: "cus_123",
    employee_ids: ["emp_1", "emp_2"],
    expand: ["attachments", "appointments"],
    location_ids: ["loc_1"],
    page: 2,
    page_size: 50,
    work_status: ["scheduled", "in_progress"],
  });
});

test("buildJobDispatchBody accepts csv employee ids", async () => {
  const body = await buildJobDispatchBody({
    employee_ids: "emp_1,emp_2",
  });

  assert.deepEqual(body, {
    dispatched_employees: [
      { employee_id: "emp_1" },
      { employee_id: "emp_2" },
    ],
  });
});

test("buildJobLockRangeBody accepts inline flags", async () => {
  const body = await buildJobLockRangeBody({
    starting_at: "2026-04-14T00:00:00Z",
    ending_at: "2026-04-14T23:59:59Z",
  });

  assert.deepEqual(body, {
    starting_at: "2026-04-14T00:00:00Z",
    ending_at: "2026-04-14T23:59:59Z",
  });
});

test("buildJobAppointmentBody accepts csv employee ids", async () => {
  const body = await buildJobAppointmentBody({
    start_time: "2026-04-16T15:00:00Z",
    end_time: "2026-04-16T17:00:00Z",
    arrival_window_minutes: "60",
    dispatched_employees_ids: "emp_1,emp_2",
  });

  assert.deepEqual(body, {
    start_time: "2026-04-16T15:00:00Z",
    end_time: "2026-04-16T17:00:00Z",
    arrival_window_minutes: 60,
    dispatched_employees_ids: ["emp_1", "emp_2"],
  });
});

test("buildJobAppointmentBody requires start_time, end_time, and dispatched_employees_ids", async () => {
  await assert.rejects(
    () =>
      buildJobAppointmentBody({
        start_time: "2026-04-16T15:00:00Z",
        end_time: "2026-04-16T17:00:00Z",
      }),
    /dispatched_employees_ids/,
  );
});

test("buildJobCreateBody requires anytime_start_date when anytime is true", async () => {
  await assert.rejects(
    () =>
      buildJobCreateBody({
        data: JSON.stringify({
          customer_id: "cus_123",
          address_id: "addr_456",
          schedule: {
            anytime: true,
          },
        }),
      }),
    /anytime_start_date/,
  );
});

test("buildJobLineItemBody rejects invalid kind", async () => {
  await assert.rejects(
    () =>
      buildJobLineItemBody({
        name: "Bad Item",
        kind: "invalid-kind",
      }),
    /Allowed values/,
  );
});
