import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { maskSecret, mergeObjects } from "./utils.js";

const DEFAULT_BASE_URL = "https://api.housecallpro.com";

export function getConfigPath() {
  return path.join(os.homedir(), ".config", "housecallcli", "config.json");
}

export async function readConfigFile() {
  const configPath = getConfigPath();

  try {
    const raw = await readFile(configPath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      return {};
    }

    throw error;
  }
}

export async function writeConfigFile(config) {
  const configPath = getConfigPath();
  await mkdir(path.dirname(configPath), { recursive: true });
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

export async function updateConfig(mutator) {
  const currentConfig = await readConfigFile();
  const nextConfig = structuredClone(currentConfig);
  const updatedConfig = (await mutator(nextConfig)) ?? nextConfig;
  await writeConfigFile(updatedConfig);
  return updatedConfig;
}

export async function loadResolvedConfig(env = process.env) {
  const fileConfig = await readConfigFile();
  return {
    fileConfig,
    resolved: resolveConfig(fileConfig, env),
  };
}

export function resolveConfig(fileConfig = {}, env = process.env) {
  const authMode =
    env.HOUSECALL_AUTH_MODE ||
    (env.HOUSECALL_ACCESS_TOKEN
      ? "bearer"
      : env.HOUSECALL_API_KEY
        ? "token"
        : fileConfig.auth?.mode);

  const authToken =
    env.HOUSECALL_ACCESS_TOKEN ||
    env.HOUSECALL_API_KEY ||
    fileConfig.auth?.token;

  return {
    base_url: env.HOUSECALL_BASE_URL || fileConfig.base_url || DEFAULT_BASE_URL,
    company_id: env.HOUSECALL_COMPANY_ID || fileConfig.company_id,
    auth: authMode && authToken ? { mode: authMode, token: authToken } : null,
    oauth: {
      client_id: env.HOUSECALL_CLIENT_ID || fileConfig.oauth?.client_id,
      client_secret:
        env.HOUSECALL_CLIENT_SECRET || fileConfig.oauth?.client_secret,
      redirect_uri:
        env.HOUSECALL_REDIRECT_URI || fileConfig.oauth?.redirect_uri,
      scope: env.HOUSECALL_SCOPE || fileConfig.oauth?.scope,
      refresh_token:
        env.HOUSECALL_REFRESH_TOKEN || fileConfig.oauth?.refresh_token,
      expires_at: fileConfig.oauth?.expires_at,
      created_at: fileConfig.oauth?.created_at,
    },
  };
}

export function buildStatusView(config) {
  return {
    config_path: getConfigPath(),
    base_url: config.base_url,
    company_id: config.company_id ?? null,
    auth: config.auth
      ? {
          mode: config.auth.mode,
          token_preview: maskSecret(config.auth.token),
        }
      : null,
    oauth: config.oauth?.client_id
      ? {
          client_id: config.oauth.client_id,
          client_secret_preview: maskSecret(config.oauth.client_secret),
          redirect_uri: config.oauth.redirect_uri ?? null,
          scope: config.oauth.scope ?? null,
          refresh_token_preview: maskSecret(config.oauth.refresh_token),
          expires_at: config.oauth.expires_at ?? null,
          created_at: config.oauth.created_at ?? null,
        }
      : null,
  };
}

export async function saveAuthToken({ mode, token, oauth }) {
  return updateConfig((config) => {
    config.auth = { mode, token };
    config.oauth = mergeObjects(config.oauth, oauth);
    return config;
  });
}
