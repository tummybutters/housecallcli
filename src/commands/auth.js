import {
  buildStatusView,
  getConfigPath,
  loadResolvedConfig,
  readConfigFile,
  saveAuthToken,
  updateConfig,
} from "../core/config.js";
import { HousecallClient } from "../core/client.js";
import { printJson, printText } from "../core/output.js";

export async function runAuthCommand(args) {
  const [action, ...rest] = args.positionals;

  switch (action) {
    case "status":
    case undefined: {
      const { resolved } = await loadResolvedConfig();
      printJson(buildStatusView(resolved));
      return;
    }

    case "api-key": {
      const token = rest[0] ?? args.flags.token;

      if (!token) {
        throw new Error("Usage: housecall auth api-key <api_key>");
      }

      await saveAuthToken({ mode: "token", token });
      printJson({
        ok: true,
        auth_mode: "token",
        config_path: getConfigPath(),
      });
      return;
    }

    case "bearer": {
      const token = rest[0] ?? args.flags.token;

      if (!token) {
        throw new Error("Usage: housecall auth bearer <access_token>");
      }

      await saveAuthToken({ mode: "bearer", token });
      printJson({
        ok: true,
        auth_mode: "bearer",
        config_path: getConfigPath(),
      });
      return;
    }

    case "company": {
      const companyId = rest[0] ?? args.flags.company_id;

      if (!companyId) {
        throw new Error("Usage: housecall auth company <company_id>");
      }

      await updateConfig((config) => {
        config.company_id = companyId;
        return config;
      });

      printJson({
        ok: true,
        company_id: companyId,
        config_path: getConfigPath(),
      });
      return;
    }

    case "clear": {
      await updateConfig((config) => {
        delete config.auth;
        delete config.oauth;
        delete config.company_id;
        return config;
      });

      printJson({ ok: true, cleared: true, config_path: getConfigPath() });
      return;
    }

    case "oauth-url": {
      const { resolved } = await loadResolvedConfig();
      const clientId = args.flags.client_id ?? resolved.oauth.client_id;
      const redirectUri = args.flags.redirect_uri ?? resolved.oauth.redirect_uri;
      const scope = args.flags.scope ?? resolved.oauth.scope;
      const state = args.flags.state;

      if (!clientId || !redirectUri) {
        throw new Error(
          "Usage: housecall auth oauth-url --client-id <id> --redirect-uri <uri> [--scope public] [--state <value>]",
        );
      }

      const url = new URL("https://pro.housecallpro.com/oauth/authorize");
      url.searchParams.set("response_type", "code");
      url.searchParams.set("client_id", clientId);
      url.searchParams.set("redirect_uri", redirectUri);

      if (scope) {
        url.searchParams.set("scope", scope);
      }

      if (state) {
        url.searchParams.set("state", state);
      }

      if (args.flags.save) {
        await updateConfig((config) => {
          config.oauth = {
            ...config.oauth,
            client_id: clientId,
            redirect_uri: redirectUri,
            scope,
          };
          return config;
        });
      }

      if (args.flags.json) {
        printJson({ url: url.toString() });
      } else {
        printText(url.toString());
      }
      return;
    }

    case "oauth-exchange": {
      const { resolved } = await loadResolvedConfig();
      const clientId = args.flags.client_id ?? resolved.oauth.client_id;
      const clientSecret =
        args.flags.client_secret ?? resolved.oauth.client_secret;
      const redirectUri =
        args.flags.redirect_uri ?? resolved.oauth.redirect_uri;
      const code = args.flags.code ?? rest[0];

      if (!clientId || !clientSecret || !redirectUri || !code) {
        throw new Error(
          "Usage: housecall auth oauth-exchange --client-id <id> --client-secret <secret> --redirect-uri <uri> --code <authorization_code>",
        );
      }

      const client = new HousecallClient({
        base_url: resolved.base_url,
        auth: { mode: "token", token: "unused" },
        oauth: resolved.oauth,
      });

      const payload = await client.fetchImpl(
        new URL("/oauth/token", resolved.base_url),
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri,
          }),
        },
      );

      const responseBody = await payload.json();

      if (!payload.ok) {
        throw new Error(
          `OAuth exchange failed: ${responseBody.error_description ?? JSON.stringify(responseBody)}`,
        );
      }

      await persistOauthGrant({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        scope: responseBody.scope,
        access_token: responseBody.access_token,
        refresh_token: responseBody.refresh_token,
        created_at: responseBody.created_at,
        expires_in: responseBody.expires_in,
      });

      printJson(responseBody);
      return;
    }

    case "oauth-refresh": {
      const { resolved } = await loadResolvedConfig();
      const clientId = args.flags.client_id ?? resolved.oauth.client_id;
      const clientSecret =
        args.flags.client_secret ?? resolved.oauth.client_secret;
      const redirectUri =
        args.flags.redirect_uri ?? resolved.oauth.redirect_uri;
      const refreshToken =
        args.flags.refresh_token ?? resolved.oauth.refresh_token;

      if (!clientId || !clientSecret || !redirectUri || !refreshToken) {
        throw new Error(
          "Usage: housecall auth oauth-refresh --client-id <id> --client-secret <secret> --redirect-uri <uri> --refresh-token <token>",
        );
      }

      const client = new HousecallClient({
        base_url: resolved.base_url,
        auth: { mode: "token", token: "unused" },
        oauth: resolved.oauth,
      });

      const payload = await client.fetchImpl(
        new URL("/oauth/token", resolved.base_url),
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "refresh_token",
            refresh_token: refreshToken,
            redirect_uri: redirectUri,
          }),
        },
      );

      const responseBody = await payload.json();

      if (!payload.ok) {
        throw new Error(
          `OAuth refresh failed: ${responseBody.error_description ?? JSON.stringify(responseBody)}`,
        );
      }

      await persistOauthGrant({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        scope: responseBody.scope,
        access_token: responseBody.access_token,
        refresh_token: responseBody.refresh_token ?? refreshToken,
        created_at: responseBody.created_at,
        expires_in: responseBody.expires_in,
      });

      printJson(responseBody);
      return;
    }

    case "path": {
      printText(getConfigPath());
      return;
    }

    default:
      throw new Error(`Unknown auth command: ${action}`);
  }
}

async function persistOauthGrant(grant) {
  const createdAt = Number(grant.created_at);
  const expiresIn = Number(grant.expires_in);
  const expiresAt =
    Number.isFinite(createdAt) && Number.isFinite(expiresIn)
      ? new Date((createdAt + expiresIn) * 1000).toISOString()
      : undefined;

  await saveAuthToken({
    mode: "bearer",
    token: grant.access_token,
    oauth: {
      client_id: grant.client_id,
      client_secret: grant.client_secret,
      redirect_uri: grant.redirect_uri,
      scope: grant.scope,
      refresh_token: grant.refresh_token,
      created_at: grant.created_at,
      expires_at: expiresAt,
    },
  });
}
