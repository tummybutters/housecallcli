import { loadResolvedConfig } from "../core/config.js";
import { HousecallClient } from "../core/client.js";
import { printJson } from "../core/output.js";
import {
  loadJsonInput,
  loadOptionalJsonValue,
  mergeObjects,
  pickDefined,
  splitCsv,
  toBoolean,
  toNumber,
} from "../core/utils.js";
import { assertAllowedValues, HOUSECALL_ENUMS } from "../core/schema-rules.js";

export async function runCustomersCommand(args) {
  const [action, ...rest] = args.positionals;
  const { resolved } = await loadResolvedConfig();
  const client = new HousecallClient(resolved);

  switch (action) {
    case "list": {
      const payload = await client.request({
        method: "GET",
        path: "/customers",
        query: buildCustomerListQuery(args.flags),
      });
      printJson(payload);
      return;
    }

    case "get": {
      const customerId = rest[0];

      if (!customerId) {
        throw new Error("Usage: housecall customers get <customer_id>");
      }

      const payload = await client.request({
        method: "GET",
        path: `/customers/${customerId}`,
        query: buildExpandableQuery(args.flags),
      });
      printJson(payload);
      return;
    }

    case "create": {
      const body = await buildCustomerWriteBody(args.flags);
      validateCreateCustomer(body);
      const payload = await client.request({
        method: "POST",
        path: "/customers",
        body,
      });
      printJson(payload);
      return;
    }

    case "update": {
      const customerId = rest[0];

      if (!customerId) {
        throw new Error("Usage: housecall customers update <customer_id> [--data @payload.json]");
      }

      const body = await buildCustomerWriteBody(args.flags, { allowAddresses: false });
      const payload = await client.request({
        method: "PUT",
        path: `/customers/${customerId}`,
        body,
      });
      printJson(payload);
      return;
    }

    case "addresses": {
      await runCustomerAddressesCommand(client, rest, args.flags);
      return;
    }

    default:
      throw new Error(`Unknown customers command: ${action}`);
  }
}

async function runCustomerAddressesCommand(client, rest, flags) {
  const [action, customerId, addressId] = rest;

  switch (action) {
    case "list": {
      if (!customerId) {
        throw new Error(
          "Usage: housecall customers addresses list <customer_id>",
        );
      }

      const payload = await client.request({
        method: "GET",
        path: `/customers/${customerId}/addresses`,
        query: pickDefined({
          page: toNumber(flags.page),
          page_size: toNumber(flags.page_size),
          sort_by: flags.sort_by,
          sort_direction: flags.sort_direction,
        }),
      });
      printJson(payload);
      return;
    }

    case "get": {
      if (!customerId || !addressId) {
        throw new Error(
          "Usage: housecall customers addresses get <customer_id> <address_id>",
        );
      }

      const payload = await client.request({
        method: "GET",
        path: `/customers/${customerId}/addresses/${addressId}`,
      });
      printJson(payload);
      return;
    }

    case "create": {
      if (!customerId) {
        throw new Error(
          "Usage: housecall customers addresses create <customer_id> [--data @payload.json]",
        );
      }

      const inputData = await loadJsonInput(flags.data);
      const body = mergeObjects(
        pickDefined({
          street: flags.street,
          street_line_2: flags.street_line_2,
          city: flags.city,
          state: flags.state,
          zip: flags.zip,
          country: flags.country,
          latitude: toNumber(flags.latitude),
          longitude: toNumber(flags.longitude),
        }),
        inputData,
      );

      const requiredFields = ["street", "city", "state", "zip", "country"];
      const missingFields = requiredFields.filter((field) => !body[field]);

      if (missingFields.length > 0) {
        throw new Error(
          `Missing required address fields: ${missingFields.join(", ")}`,
        );
      }

      const payload = await client.request({
        method: "POST",
        path: `/customers/${customerId}/addresses`,
        body,
      });
      printJson(payload);
      return;
    }

    default:
      throw new Error(`Unknown customers addresses command: ${action}`);
  }
}

function buildCustomerListQuery(flags) {
  const query = pickDefined({
    expand: splitCsv(flags.expand),
    location_ids: splitCsv(flags.location_ids ?? flags.location_id),
    page: toNumber(flags.page),
    page_size: toNumber(flags.page_size),
    q: flags.q,
    sort_by: flags.sort_by,
    sort_direction: flags.sort_direction,
  });

  assertAllowedValues(query.expand, HOUSECALL_ENUMS.customerExpand, "customer expand");

  return query;
}

function buildExpandableQuery(flags) {
  const query = pickDefined({
    expand: splitCsv(flags.expand),
  });

  assertAllowedValues(query.expand, HOUSECALL_ENUMS.customerExpand, "customer expand");

  return query;
}

async function buildCustomerWriteBody(flags, options = {}) {
  const allowAddresses = options.allowAddresses ?? true;
  const inputData = await loadJsonInput(flags.data);

  const merged = mergeObjects(
    pickDefined({
      first_name: flags.first_name,
      last_name: flags.last_name,
      email: flags.email,
      company: flags.company,
      notifications_enabled: toBoolean(flags.notifications_enabled),
      mobile_number: flags.mobile_number,
      home_number: flags.home_number,
      work_number: flags.work_number,
      tags: flags.tags ? splitCsv(flags.tags) : splitCsv(flags.tag),
      lead_source: flags.lead_source,
      notes: flags.notes,
      addresses: allowAddresses
        ? await loadOptionalJsonValue(flags.addresses)
        : undefined,
    }),
    inputData,
  );

  if (!allowAddresses) {
    delete merged.addresses;
  }

  return merged;
}

function validateCreateCustomer(body) {
  const hasAtLeastOneIdentityField = [
    "first_name",
    "last_name",
    "email",
    "mobile_number",
    "home_number",
    "work_number",
  ].some((field) => body[field]);

  if (!hasAtLeastOneIdentityField) {
    throw new Error(
      "Creating a customer requires at least one of first_name, last_name, email, mobile_number, home_number, or work_number.",
    );
  }
}
