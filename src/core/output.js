export function printJson(payload) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

export function printText(value) {
  process.stdout.write(`${value}\n`);
}
