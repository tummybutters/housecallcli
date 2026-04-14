import test from "node:test";
import assert from "node:assert/strict";

import {
  buildEstimateListQuery,
  buildEstimateCreateBody,
  buildEstimateOptionBody,
  buildOptionIdsPayload,
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
