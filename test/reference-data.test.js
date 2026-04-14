import test from "node:test";
import assert from "node:assert/strict";

import {
  buildJobTypeBody,
  buildJobTypesListQuery,
} from "../src/commands/job-types.js";
import {
  buildLeadSourceBody,
  buildLeadSourcesListQuery,
} from "../src/commands/lead-sources.js";

test("buildJobTypesListQuery accepts name filter", () => {
  const query = buildJobTypesListQuery({
    name: "Maintenance",
  });

  assert.deepEqual(query, {
    name: "Maintenance",
  });
});

test("buildJobTypeBody accepts name flag", async () => {
  const body = await buildJobTypeBody({
    name: "Install",
  });

  assert.deepEqual(body, {
    name: "Install",
  });
});

test("buildLeadSourcesListQuery normalizes pagination", () => {
  const query = buildLeadSourcesListQuery({
    page: "2",
    page_size: "15",
    q: "Google",
    sort_direction: "asc",
  });

  assert.deepEqual(query, {
    page: 2,
    page_size: 15,
    q: "Google",
    sort_direction: "asc",
  });
});

test("buildLeadSourceBody accepts name flag", async () => {
  const body = await buildLeadSourceBody({
    name: "Referral",
  });

  assert.deepEqual(body, {
    name: "Referral",
  });
});
