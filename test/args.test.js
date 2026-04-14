import test from "node:test";
import assert from "node:assert/strict";

import { parseArgs } from "../src/core/args.js";

test("parseArgs supports repeated flags and inline values", () => {
  const parsed = parseArgs([
    "customers",
    "list",
    "--expand=attachments,do_not_service",
    "--page",
    "2",
    "--tag",
    "vip",
    "--tag",
    "install",
  ]);

  assert.deepEqual(parsed.positionals, ["customers", "list"]);
  assert.equal(parsed.flags.expand, "attachments,do_not_service");
  assert.equal(parsed.flags.page, "2");
  assert.deepEqual(parsed.flags.tag, ["vip", "install"]);
});

test("parseArgs supports negated boolean flags", () => {
  const parsed = parseArgs(["customers", "create", "--no-notifications-enabled"]);
  assert.equal(parsed.flags.notifications_enabled, false);
});
