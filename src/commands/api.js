import { loadResolvedConfig } from "../core/config.js";
import { HousecallClient } from "../core/client.js";
import { printJson } from "../core/output.js";
import { loadJsonInput, pickDefined, splitCsv } from "../core/utils.js";

export async function runApiCommand(args) {
  const [method, rawPath] = args.positionals;

  if (!method || !rawPath) {
    throw new Error(
      "Usage: housecall api <method> <path> [--query key=value] [--data '{\"foo\":\"bar\"}']",
    );
  }

  const query = {};

  for (const entry of splitCsv(args.flags.query)) {
    const [key, ...valueParts] = entry.split("=");

    if (!key || valueParts.length === 0) {
      throw new Error(`Invalid query flag: ${entry}`);
    }

    const value = valueParts.join("=");

    if (query[key] === undefined) {
      query[key] = value;
    } else if (Array.isArray(query[key])) {
      query[key].push(value);
    } else {
      query[key] = [query[key], value];
    }
  }

  const headerEntries = {};

  for (const entry of splitCsv(args.flags.header)) {
    const [key, ...valueParts] = entry.split("=");

    if (!key || valueParts.length === 0) {
      throw new Error(`Invalid header flag: ${entry}`);
    }

    headerEntries[key] = valueParts.join("=");
  }

  const body = await loadJsonInput(args.flags.data);
  const { resolved } = await loadResolvedConfig();
  const client = new HousecallClient(resolved);
  const payload = await client.request({
    method: method.toUpperCase(),
    path: rawPath,
    query: pickDefined(query),
    headers: pickDefined(headerEntries),
    body,
  });

  printJson(payload);
}
