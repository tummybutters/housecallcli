import { toFlagName } from "./utils.js";

export function parseArgs(argv) {
  const positionals = [];
  const flags = {};
  let stopParsingFlags = false;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (stopParsingFlags || token === "-" || !token.startsWith("-")) {
      positionals.push(token);
      continue;
    }

    if (token === "--") {
      stopParsingFlags = true;
      continue;
    }

    if (token.startsWith("--no-")) {
      setFlag(flags, toFlagName(token.slice(5)), false);
      continue;
    }

    if (token.startsWith("--")) {
      const trimmed = token.slice(2);
      const separatorIndex = trimmed.indexOf("=");

      if (separatorIndex >= 0) {
        const name = toFlagName(trimmed.slice(0, separatorIndex));
        const value = trimmed.slice(separatorIndex + 1);
        setFlag(flags, name, value);
        continue;
      }

      const name = toFlagName(trimmed);
      const nextToken = argv[index + 1];

      if (nextToken !== undefined && (nextToken === "-" || !nextToken.startsWith("-"))) {
        setFlag(flags, name, nextToken);
        index += 1;
        continue;
      }

      setFlag(flags, name, true);
      continue;
    }

    if (token.startsWith("-")) {
      const letters = token.slice(1).split("");

      for (const letter of letters) {
        setFlag(flags, letter, true);
      }
    }
  }

  return { positionals, flags };
}

function setFlag(flags, name, value) {
  if (flags[name] === undefined) {
    flags[name] = value;
    return;
  }

  if (Array.isArray(flags[name])) {
    flags[name].push(value);
    return;
  }

  flags[name] = [flags[name], value];
}
