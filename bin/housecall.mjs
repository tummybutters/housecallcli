#!/usr/bin/env node

import { run } from "../src/cli.js";

run(process.argv.slice(2)).catch((error) => {
  const message = error?.message ?? String(error);
  console.error(message);

  if (
    error?.details &&
    Object.values(error.details).some((value) => value !== undefined)
  ) {
    console.error(JSON.stringify(error.details, null, 2));
  }

  process.exitCode = typeof error?.exitCode === "number" ? error.exitCode : 1;
});
