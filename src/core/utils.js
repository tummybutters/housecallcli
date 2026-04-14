import { readFile } from "node:fs/promises";

export function toFlagName(name) {
  return name.replace(/-/g, "_");
}

export function splitCsv(value) {
  if (value === undefined || value === null) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => splitCsv(entry));
  }

  return String(value)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function toBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const normalized = String(value).trim().toLowerCase();

  if (["true", "1", "yes", "y", "on"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no", "n", "off"].includes(normalized)) {
    return false;
  }

  return undefined;
}

export function toNumber(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : undefined;
}

export function maskSecret(value) {
  if (!value) {
    return null;
  }

  const stringValue = String(value);

  if (stringValue.length <= 8) {
    return `${stringValue.slice(0, 2)}...${stringValue.slice(-2)}`;
  }

  return `${stringValue.slice(0, 4)}...${stringValue.slice(-4)}`;
}

export function pickDefined(input) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
}

export function mergeObjects(...objects) {
  return objects.reduce((accumulator, current) => {
    if (!current) {
      return accumulator;
    }

    for (const [key, value] of Object.entries(current)) {
      if (value !== undefined) {
        accumulator[key] = value;
      }
    }

    return accumulator;
  }, {});
}

export async function loadJsonInput(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (value === "-") {
    const chunks = [];

    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }

    return parseJsonText(Buffer.concat(chunks).toString("utf8"));
  }

  if (String(value).startsWith("@")) {
    const filePath = String(value).slice(1);
    const contents = await readFile(filePath, "utf8");
    return parseJsonText(contents);
  }

  return parseJsonText(String(value));
}

export async function loadOptionalJsonValue(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const stringValue = String(value);

  if (
    value === "-" ||
    stringValue.startsWith("@") ||
    stringValue.startsWith("{") ||
    stringValue.startsWith("[")
  ) {
    return loadJsonInput(value);
  }

  return undefined;
}

export function parseJsonText(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    error.message = `Invalid JSON payload: ${error.message}`;
    throw error;
  }
}
