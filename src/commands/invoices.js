import { loadResolvedConfig } from "../core/config.js";
import { HousecallClient } from "../core/client.js";
import { printJson, printText } from "../core/output.js";
import { pickDefined, splitCsv, toNumber } from "../core/utils.js";
import { assertAllowedValues, HOUSECALL_ENUMS } from "../core/schema-rules.js";

export async function runInvoicesCommand(args) {
  const [action, ...rest] = args.positionals;
  const { resolved } = await loadResolvedConfig();
  const client = new HousecallClient(resolved);

  switch (action) {
    case "list": {
      const payload = await client.request({
        method: "GET",
        path: "/invoices",
        query: buildInvoicesListQuery(args.flags),
      });
      printJson(payload);
      return;
    }

    case "get": {
      const invoiceUuid = rest[0];

      if (!invoiceUuid) {
        throw new Error("Usage: housecall invoices get <invoice_uuid>");
      }

      const payload = await client.request({
        method: "GET",
        path: `/api/invoices/${invoiceUuid}`,
      });
      printJson(payload);
      return;
    }

    case "preview": {
      const invoiceUuid = rest[0];

      if (!invoiceUuid) {
        throw new Error("Usage: housecall invoices preview <invoice_uuid>");
      }

      const payload = await client.request({
        method: "GET",
        path: `/api/invoices/${invoiceUuid}/preview`,
        headers: {
          Accept: "text/html, application/json",
        },
      });
      printText(payload ?? "");
      return;
    }

    default:
      throw new Error(`Unknown invoices command: ${action}`);
  }
}

export function buildInvoicesListQuery(flags) {
  const query = pickDefined({
    amount_due_max: toNumber(flags.amount_due_max),
    amount_due_min: toNumber(flags.amount_due_min),
    created_at_max: flags.created_at_max,
    created_at_min: flags.created_at_min,
    customer_uuid: csvOrUndefined(flags.customer_uuid),
    due_at_max: flags.due_at_max,
    due_at_min: flags.due_at_min,
    location_ids: csvOrUndefined(flags.location_ids ?? flags.location_id),
    page: toNumber(flags.page),
    page_size: toNumber(flags.page_size),
    paid_at_max: flags.paid_at_max,
    paid_at_min: flags.paid_at_min,
    payment_method: csvOrUndefined(flags.payment_method),
    sort_by: flags.sort_by,
    sort_direction: flags.sort_direction,
    status: csvOrUndefined(flags.status),
  });

  assertAllowedValues(
    query.payment_method,
    HOUSECALL_ENUMS.paymentMethod,
    "invoice payment_method",
  );
  assertAllowedValues(
    query.status,
    HOUSECALL_ENUMS.invoiceStatus,
    "invoice status",
  );

  return query;
}

function csvOrUndefined(value) {
  const items = splitCsv(value);
  return items.length > 0 ? items : undefined;
}
