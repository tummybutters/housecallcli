import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPriceFormCreateBody,
  buildPriceFormUpdateBody,
} from "../src/commands/price-forms.js";

test("buildPriceFormCreateBody parses nested json flags", async () => {
  const body = await buildPriceFormCreateBody({
    name: "Seasonal Tune-Up",
    automatically_add_to_new_job: "true",
    taxable: "true",
    olb_enabled: "false",
    duration_in_minutes: "90",
    dynamic_duration_enabled: "true",
    bookable_as: "jobs",
    assigned:
      '{"pros":[{"uuid":"pro_b9d8d7384b894851b03c1df9a748f653","full_name":"Jordan Lee"}],"tags":["maintenance"]}',
    fields_attributes:
      '[{"name":"Unit count","kind":"quantity_select","price":9900,"order_index":0,"duration_in_minutes":90,"options_attributes":[{"name":"1 unit","price":0}],"service_area_fields_attributes":[{"service_zone_id":"2a742be3-6451-4dc4-bcf1-f8c5a6956009","price":10900,"service_area_field_options_attributes":[{"price":0}]}]}]',
  });

  assert.deepEqual(body, {
    name: "Seasonal Tune-Up",
    automatically_add_to_new_job: true,
    taxable: true,
    olb_enabled: false,
    duration_in_minutes: 90,
    dynamic_duration_enabled: true,
    bookable_as: "jobs",
    assigned: {
      pros: [
        {
          uuid: "pro_b9d8d7384b894851b03c1df9a748f653",
          full_name: "Jordan Lee",
        },
      ],
      tags: ["maintenance"],
    },
    fields_attributes: [
      {
        name: "Unit count",
        kind: "quantity_select",
        price: 9900,
        order_index: 0,
        duration_in_minutes: 90,
        options_attributes: [
          {
            name: "1 unit",
            price: 0,
          },
        ],
        service_area_fields_attributes: [
          {
            service_zone_id: "2a742be3-6451-4dc4-bcf1-f8c5a6956009",
            price: 10900,
            service_area_field_options_attributes: [
              {
                price: 0,
              },
            ],
          },
        ],
      },
    ],
  });
});

test("buildPriceFormCreateBody requires name", async () => {
  await assert.rejects(
    () =>
      buildPriceFormCreateBody({
        taxable: "true",
      }),
    /Missing required price form fields: name/,
  );
});

test("buildPriceFormUpdateBody rejects invalid bookable_as", async () => {
  await assert.rejects(
    () =>
      buildPriceFormUpdateBody({
        data: JSON.stringify({
          bookable_as: "visits",
        }),
      }),
    /Allowed values: jobs, estimates/,
  );
});

test("buildPriceFormUpdateBody rejects invalid field id pattern", async () => {
  await assert.rejects(
    () =>
      buildPriceFormUpdateBody({
        data: JSON.stringify({
          fields_attributes: [
            {
              id: "field_123",
            },
          ],
        }),
      }),
    /fields_attributes\[0\]\.id/,
  );
});

test("buildPriceFormUpdateBody requires at least one field", async () => {
  await assert.rejects(
    () => buildPriceFormUpdateBody({}),
    /at least one field/,
  );
});
