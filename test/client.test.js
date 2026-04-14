import test from "node:test";
import assert from "node:assert/strict";

import { buildUrl } from "../src/core/client.js";

test("buildUrl repeats array query params", () => {
  const url = buildUrl("https://api.housecallpro.com", "/customers", {
    expand: ["attachments", "do_not_service"],
    page: 2,
  });

  assert.equal(
    url,
    "https://api.housecallpro.com/customers?expand=attachments&expand=do_not_service&page=2",
  );
});
