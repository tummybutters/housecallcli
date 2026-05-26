import test from "node:test";
import assert from "node:assert/strict";

import {
  buildEstimateListQuery,
  buildEstimateCreateBody,
  buildEstimateOptionBody,
  buildApproveAndCheckJobOptions,
  buildOptionIdsPayload,
  approveEstimateOptionsAndCheckJob,
  detectNewJobs,
  extractEstimateCustomerId,
} from "../src/commands/estimates.js";
import { HousecallClient } from "../src/core/client.js";

test("buildEstimateListQuery normalizes arrays and numbers", () => {
  const query = buildEstimateListQuery({
    customer_id: "cus_123",
    employee_ids: "emp_1,emp_2",
    location_ids: "loc_1",
    page: "2",
    page_size: "50",
    work_status: "scheduled,completed",
  });

  assert.deepEqual(query, {
    customer_id: "cus_123",
    employee_ids: ["emp_1", "emp_2"],
    location_ids: ["loc_1"],
    page: 2,
    page_size: 50,
    work_status: ["scheduled", "completed"],
  });
});

test("buildOptionIdsPayload accepts csv option ids", async () => {
  const body = await buildOptionIdsPayload({
    option_ids: "opt_1,opt_2",
  });

  assert.deepEqual(body, {
    option_ids: ["opt_1", "opt_2"],
  });
});

test("buildApproveAndCheckJobOptions normalizes numeric polling flags", () => {
  const options = buildApproveAndCheckJobOptions({
    max_wait_ms: "15000",
    poll_interval_ms: "500",
    page_size: "25",
    work_status: "scheduled,unscheduled",
    expand: "attachments,appointments",
  });

  assert.deepEqual(options, {
    maxWaitMs: 15000,
    pollIntervalMs: 500,
    pageSize: 25,
    workStatus: ["scheduled", "unscheduled"],
    expand: ["attachments", "appointments"],
  });
});

test("extractEstimateCustomerId prefers nested customer id", () => {
  assert.equal(
    extractEstimateCustomerId({
      customer: {
        id: "cus_nested",
      },
      customer_id: "cus_flat",
    }),
    "cus_nested",
  );
});

test("detectNewJobs returns only job ids not seen before", () => {
  const newJobs = detectNewJobs(
    [{ id: "job_old" }],
    [{ id: "job_old" }, { id: "job_new" }],
  );

  assert.deepEqual(newJobs, [{ id: "job_new" }]);
});

test("buildEstimateCreateBody validates pricing form ids in option line items", async () => {
  await assert.rejects(
    () =>
      buildEstimateCreateBody({
        data: JSON.stringify({
          customer_id: "cus_123",
          options: [
            {
              name: "Option A",
              line_items: [
                {
                  name: "Line Item",
                  pricing_form: {
                    id: "bad-id",
                    fields: [],
                  },
                },
              ],
            },
          ],
        }),
      }),
    /pricing_form\.id/,
  );
});

test("buildEstimateOptionBody requires tax fields when taxable", async () => {
  await assert.rejects(
    () =>
      buildEstimateOptionBody({
        data: JSON.stringify({
          name: "Option A",
          tax: {
            taxable: true,
          },
        }),
      }),
    /tax_rate/,
  );
});

test("HousecallClient preserves FormData bodies for multipart uploads", async () => {
  let receivedBody;
  let receivedHeaders;

  const client = new HousecallClient(
    {
      base_url: "https://api.housecallpro.com",
      auth: { mode: "token", token: "abc123" },
    },
    {
      fetchImpl: async (_url, init) => {
        receivedBody = init.body;
        receivedHeaders = init.headers;

        return new Response("{}", {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    },
  );

  const formData = new FormData();
  formData.append("file", new Blob(["hello"]), "hello.txt");

  await client.request({
    method: "POST",
    path: "/upload",
    body: formData,
  });

  assert.ok(receivedBody instanceof FormData);
  assert.equal(receivedHeaders["Content-Type"], undefined);
});

test("approveEstimateOptionsAndCheckJob returns detected jobs after approval polling", async () => {
  const calls = [];
  const client = {
    async request(input) {
      calls.push(input);

      if (input.method === "GET" && input.path === "/estimates/csr_123") {
        return {
          id: "csr_123",
          customer: { id: "cus_123" },
          address: { id: "adr_123" },
          options: [{ id: "opt_1" }],
        };
      }

      if (input.method === "POST" && input.path === "/estimates/options/approve") {
        return {
          approved_option_ids: input.body.option_ids,
        };
      }

      if (input.method === "GET" && input.path === "/jobs") {
        const page = input.query.page;

        if (calls.filter((entry) => entry.path === "/jobs").length === 1) {
          return {
            page,
            page_size: input.query.page_size,
            total_pages: 1,
            jobs: [{ id: "job_old" }],
          };
        }

        if (calls.filter((entry) => entry.path === "/jobs").length === 2) {
          return {
            page,
            page_size: input.query.page_size,
            total_pages: 1,
            jobs: [{ id: "job_old" }],
          };
        }

        return {
          page,
          page_size: input.query.page_size,
          total_pages: 1,
          jobs: [{ id: "job_old" }, { id: "job_new" }],
        };
      }

      throw new Error(`Unexpected request: ${JSON.stringify(input)}`);
    },
  };

  const result = await approveEstimateOptionsAndCheckJob(client, {
    estimateId: "csr_123",
    optionIds: ["opt_1"],
    maxWaitMs: 2000,
    pollIntervalMs: 10,
    pageSize: 25,
    sleepImpl: async () => {},
  });

  assert.equal(result.estimate.customer_id, "cus_123");
  assert.equal(result.job_check.status, "job_detected");
  assert.equal(result.job_check.new_job_count, 1);
  assert.deepEqual(result.job_check.new_jobs.map((job) => job.id), ["job_new"]);
  assert.deepEqual(result.approval, {
    approved_option_ids: ["opt_1"],
  });
});

test("approveEstimateOptionsAndCheckJob returns unverifiable when estimate has no customer id", async () => {
  const client = {
    async request(input) {
      if (input.method === "GET" && input.path === "/estimates/csr_123") {
        return {
          id: "csr_123",
          options: [{ id: "opt_1" }],
        };
      }

      if (input.method === "POST" && input.path === "/estimates/options/approve") {
        return {
          approved_option_ids: input.body.option_ids,
        };
      }

      throw new Error(`Unexpected request: ${JSON.stringify(input)}`);
    },
  };

  const result = await approveEstimateOptionsAndCheckJob(client, {
    estimateId: "csr_123",
    optionIds: ["opt_1"],
    maxWaitMs: 0,
    pollIntervalMs: 0,
  });

  assert.equal(result.job_check.status, "unverifiable");
  assert.equal(result.job_check.reason, "estimate payload did not include a customer id");
});
