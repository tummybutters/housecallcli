import test from "node:test";
import assert from "node:assert/strict";

import {
  buildLeadConvertBody,
  buildLeadCreateBody,
  buildLeadsListQuery,
} from "../src/commands/leads.js";

test("buildLeadsListQuery normalizes arrays and numbers", () => {
  const query = buildLeadsListQuery({
    customer_id: "cus_123",
    employee_ids: "emp_1,emp_2",
    lead_source: "Referral,Website",
    location_ids: "loc_1",
    page: "2",
    page_size: "25",
    sort_by: "status",
    sort_direction: "asc",
    status: "open",
    tag_ids: "tag_1,tag_2",
  });

  assert.deepEqual(query, {
    customer_id: "cus_123",
    employee_ids: ["emp_1", "emp_2"],
    lead_source: ["Referral", "Website"],
    location_ids: ["loc_1"],
    page: 2,
    page_size: 25,
    sort_by: "status",
    sort_direction: "asc",
    status: "open",
    tag_ids: ["tag_1", "tag_2"],
  });
});

test("buildLeadCreateBody parses nested json flags", async () => {
  const body = await buildLeadCreateBody({
    customer: '{"first_name":"Jordan"}',
    address: '{"city":"Los Angeles"}',
    line_items: '[{"name":"Diagnostic"}]',
    tags: "priority,new",
    tax_rate: "8",
  });

  assert.deepEqual(body, {
    customer: { first_name: "Jordan" },
    address: { city: "Los Angeles" },
    line_items: [{ name: "Diagnostic" }],
    tags: ["priority", "new"],
    tax_rate: 8,
  });
});

test("buildLeadCreateBody requires customer_id or customer", async () => {
  await assert.rejects(
    () =>
      buildLeadCreateBody({
        note: "Missing customer reference",
      }),
    /either customer_id or customer/i,
  );
});

test("buildLeadConvertBody accepts positional type", async () => {
  const body = await buildLeadConvertBody({}, "estimate");

  assert.deepEqual(body, {
    type: "estimate",
  });
});

test("buildLeadCreateBody rejects invalid line item kind", async () => {
  await assert.rejects(
    () =>
      buildLeadCreateBody({
        data: JSON.stringify({
          customer_id: "cus_123",
          line_items: [
            {
              name: "Diagnostic",
              kind: "not-real",
            },
          ],
        }),
      }),
    /Allowed values/,
  );
});

test("buildLeadCreateBody rejects fixed gratuity for lead line items", async () => {
  await assert.rejects(
    () =>
      buildLeadCreateBody({
        data: JSON.stringify({
          customer_id: "cus_123",
          line_items: [
            {
              name: "Discount",
              kind: "fixed gratuity",
            },
          ],
        }),
      }),
    /Allowed values: labor, materials, fixed discount, percent discount/,
  );
});
