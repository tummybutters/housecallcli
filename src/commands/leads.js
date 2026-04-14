import { loadResolvedConfig } from "../core/config.js";
import { HousecallClient } from "../core/client.js";
import { printJson } from "../core/output.js";
import {
  loadJsonInput,
  loadOptionalJsonValue,
  mergeObjects,
  pickDefined,
  splitCsv,
  toNumber,
} from "../core/utils.js";
import {
  assertAllowedValue,
  HOUSECALL_ENUMS,
  validatePriceFormsInLineItems,
} from "../core/schema-rules.js";

export async function runLeadsCommand(args) {
  const [action, ...rest] = args.positionals;
  const { resolved } = await loadResolvedConfig();
  const client = new HousecallClient(resolved);

  switch (action) {
    case "list": {
      const payload = await client.request({
        method: "GET",
        path: "/leads",
        query: buildLeadsListQuery(args.flags),
      });
      printJson(payload);
      return;
    }

    case "get": {
      const leadId = rest[0];

      if (!leadId) {
        throw new Error("Usage: housecall leads get <lead_id>");
      }

      const payload = await client.request({
        method: "GET",
        path: `/leads/${leadId}`,
      });
      printJson(payload);
      return;
    }

    case "create": {
      const body = await buildLeadCreateBody(args.flags);
      const payload = await client.request({
        method: "POST",
        path: "/leads",
        body,
      });
      printJson(payload);
      return;
    }

    case "convert": {
      const leadId = rest[0];
      const typeArg = rest[1];

      if (!leadId) {
        throw new Error(
          "Usage: housecall leads convert <lead_id> --type estimate|job",
        );
      }

      const body = await buildLeadConvertBody(args.flags, typeArg);
      validateLeadConvertBody(body);
      const payload = await client.request({
        method: "POST",
        path: `/leads/${leadId}/convert`,
        body,
      });
      printJson(payload);
      return;
    }

    case "line-items": {
      await runLeadLineItemsCommand(client, rest, args.flags);
      return;
    }

    default:
      throw new Error(`Unknown leads command: ${action}`);
  }
}

export function buildLeadsListQuery(flags) {
  const query = pickDefined({
    customer_id: flags.customer_id,
    employee_ids: csvOrUndefined(flags.employee_ids ?? flags.employee_id),
    lead_source: csvOrUndefined(flags.lead_source),
    location_ids: csvOrUndefined(flags.location_ids ?? flags.location_id),
    page: toNumber(flags.page),
    page_size: toNumber(flags.page_size),
    sort_by: flags.sort_by,
    sort_direction: flags.sort_direction,
    status: flags.status,
    tag_ids: csvOrUndefined(flags.tag_ids ?? flags.tag_id),
  });

  assertAllowedValue(query.status, HOUSECALL_ENUMS.leadStatus, "lead status");

  return query;
}

export async function buildLeadCreateBody(flags) {
  const inputData = await loadJsonInput(flags.data);

  const body = mergeObjects(
    pickDefined({
      customer_id: flags.customer_id,
      customer: await loadOptionalJsonValue(flags.customer),
      assigned_employee_id: flags.assigned_employee_id,
      address_id: flags.address_id,
      address: await loadOptionalJsonValue(flags.address),
      lead_source: flags.lead_source,
      line_items: await loadOptionalJsonValue(flags.line_items),
      note: flags.note,
      tags: csvOrUndefined(flags.tags ?? flags.tag),
      tax_name: flags.tax_name,
      tax_rate: toNumber(flags.tax_rate),
    }),
    inputData,
  );

  for (const [lineItemIndex, lineItem] of (body.line_items ?? []).entries()) {
    assertAllowedValue(
      lineItem?.kind,
      HOUSECALL_ENUMS.leadLineItemKind,
      `lead line_items[${lineItemIndex}].kind`,
    );
  }

  validatePriceFormsInLineItems(body.line_items, "lead.line_items");
  validateLeadCreateBody(body);

  return body;
}

export async function buildLeadConvertBody(flags, typeArg) {
  const inputData = await loadJsonInput(flags.data);

  return mergeObjects(
    pickDefined({
      type: flags.type ?? typeArg,
    }),
    inputData,
  );
}

export function buildLeadLineItemsQuery(flags) {
  return pickDefined({
    page: toNumber(flags.page),
    page_size: toNumber(flags.page_size),
  });
}

async function runLeadLineItemsCommand(client, rest, flags) {
  const [action, leadId] = rest;

  if (action !== "list" || !leadId) {
    throw new Error("Usage: housecall leads line-items list <lead_id>");
  }

  const payload = await client.request({
    method: "GET",
    path: `/leads/${leadId}/line_items`,
    query: buildLeadLineItemsQuery(flags),
  });
  printJson(payload);
}

function csvOrUndefined(value) {
  const items = splitCsv(value);
  return items.length > 0 ? items : undefined;
}

function validateLeadCreateBody(body) {
  if (!body.customer_id && !body.customer) {
    throw new Error(
      "Creating a lead requires either customer_id or customer.",
    );
  }
}

function validateLeadConvertBody(body) {
  if (!body.type) {
    throw new Error("Lead conversion requires type=estimate or type=job.");
  }

  if (!HOUSECALL_ENUMS.leadConvertType.includes(body.type)) {
    throw new Error("Lead conversion type must be either estimate or job.");
  }
}
