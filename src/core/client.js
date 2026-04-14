import { saveAuthToken } from "./config.js";

export class ApiError extends Error {
  constructor(message, { status, body, request } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    this.request = request;
    this.details = { status, body, request };
    this.exitCode = 1;
  }
}

export class HousecallClient {
  constructor(config, options = {}) {
    this.config = config;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async request({ method = "GET", path, query, body, headers, retry = true }) {
    const requestUrl = buildUrl(this.config.base_url, path, query);
    const requestHeaders = {
      Accept: "application/json",
      ...this.getAuthHeaders(),
      ...(headers ?? {}),
    };

    const shouldJsonEncodeBody = body !== undefined && !isRawBody(body);

    if (shouldJsonEncodeBody && requestHeaders["Content-Type"] === undefined) {
      requestHeaders["Content-Type"] = "application/json";
    }

    const response = await this.fetchImpl(requestUrl, {
      method,
      headers: requestHeaders,
      body:
        body === undefined
          ? undefined
          : shouldJsonEncodeBody
            ? JSON.stringify(body)
            : body,
    });

    if (response.status === 401 && retry && this.canRefreshToken()) {
      await this.refreshAccessToken();
      return this.request({ method, path, query, body, headers, retry: false });
    }

    const payload = await parseResponse(response);

    if (!response.ok) {
      throw new ApiError(
        `Housecall API request failed with status ${response.status}`,
        {
          status: response.status,
          body: payload,
          request: { method, url: requestUrl },
        },
      );
    }

    return payload;
  }

  getAuthHeaders() {
    if (!this.config.auth?.mode || !this.config.auth?.token) {
      throw new ApiError(
        "Missing Housecall authentication. Run `housecall auth api-key <key>`, `housecall auth bearer <token>`, or set HOUSECALL_API_KEY / HOUSECALL_ACCESS_TOKEN.",
      );
    }

    return {
      Authorization:
        this.config.auth.mode === "bearer"
          ? `Bearer ${this.config.auth.token}`
          : `Token ${this.config.auth.token}`,
      ...(this.config.company_id ? { "X-Company-Id": this.config.company_id } : {}),
    };
  }

  canRefreshToken() {
    return (
      this.config.auth?.mode === "bearer" &&
      this.config.oauth?.refresh_token &&
      this.config.oauth?.client_id &&
      this.config.oauth?.client_secret &&
      this.config.oauth?.redirect_uri
    );
  }

  async refreshAccessToken() {
    const body = {
      client_id: this.config.oauth.client_id,
      client_secret: this.config.oauth.client_secret,
      grant_type: "refresh_token",
      refresh_token: this.config.oauth.refresh_token,
      redirect_uri: this.config.oauth.redirect_uri,
    };

    const response = await this.fetchImpl(
      new URL("/oauth/token", this.config.base_url),
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    const payload = await parseResponse(response);

    if (!response.ok) {
      throw new ApiError("Unable to refresh Housecall OAuth token", {
        status: response.status,
        body: payload,
        request: { method: "POST", url: new URL("/oauth/token", this.config.base_url).toString() },
      });
    }

    const createdAt = Number(payload.created_at);
    const expiresIn = Number(payload.expires_in);
    const expiresAt =
      Number.isFinite(createdAt) && Number.isFinite(expiresIn)
        ? new Date((createdAt + expiresIn) * 1000).toISOString()
        : undefined;

    await saveAuthToken({
      mode: "bearer",
      token: payload.access_token,
      oauth: {
        client_id: this.config.oauth.client_id,
        client_secret: this.config.oauth.client_secret,
        redirect_uri: this.config.oauth.redirect_uri,
        scope: payload.scope ?? this.config.oauth.scope,
        refresh_token: payload.refresh_token ?? this.config.oauth.refresh_token,
        created_at: payload.created_at ?? this.config.oauth.created_at,
        expires_at: expiresAt,
      },
    });

    this.config.auth = { mode: "bearer", token: payload.access_token };
    this.config.oauth = {
      ...this.config.oauth,
      scope: payload.scope ?? this.config.oauth.scope,
      refresh_token: payload.refresh_token ?? this.config.oauth.refresh_token,
      created_at: payload.created_at ?? this.config.oauth.created_at,
      expires_at: expiresAt ?? this.config.oauth.expires_at,
    };
  }
}

export function buildUrl(baseUrl, path, query = {}) {
  const url = new URL(path.startsWith("/") ? path : `/${path}`, baseUrl);

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        url.searchParams.append(key, String(entry));
      }
      continue;
    }

    url.searchParams.append(key, String(value));
  }

  return url.toString();
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();

  if (!text) {
    return null;
  }

  if (contentType.includes("application/json")) {
    return JSON.parse(text);
  }

  return text;
}

function isRawBody(body) {
  return (
    typeof body === "string" ||
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof URLSearchParams ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body)
  );
}
