import test from "node:test";
import assert from "node:assert/strict";

import { buildStatusView, resolveConfig } from "../src/core/config.js";

test("resolveConfig prefers environment auth over file config", () => {
  const resolved = resolveConfig(
    {
      auth: { mode: "token", token: "file-token" },
      oauth: { client_id: "file-client" },
    },
    {
      HOUSECALL_ACCESS_TOKEN: "env-token",
      HOUSECALL_REDIRECT_URI: "https://example.com/callback",
    },
  );

  assert.deepEqual(resolved.auth, { mode: "bearer", token: "env-token" });
  assert.equal(resolved.oauth.client_id, "file-client");
  assert.equal(resolved.oauth.redirect_uri, "https://example.com/callback");
});

test("buildStatusView redacts stored secrets", () => {
  const view = buildStatusView({
    base_url: "https://api.housecallpro.com",
    company_id: "cmp_123",
    auth: { mode: "token", token: "1234567890abcdef" },
    oauth: {
      client_id: "client_123",
      client_secret: "secret_123456",
      refresh_token: "refresh_123456",
      redirect_uri: "https://example.com/callback",
      scope: "public",
      expires_at: "2026-01-01T00:00:00.000Z",
      created_at: 1750104252,
    },
  });

  assert.equal(view.auth.token_preview, "1234...cdef");
  assert.equal(view.oauth.client_secret_preview, "secr...3456");
  assert.equal(view.oauth.refresh_token_preview, "refr...3456");
});
