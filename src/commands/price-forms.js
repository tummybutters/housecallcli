import { loadResolvedConfig } from "../core/config.js";
import { HousecallClient } from "../core/client.js";
import { printJson } from "../core/output.js";
import {
  loadJsonInput,
  loadOptionalJsonValue,
  mergeObjects,
  pickDefined,
  toBoolean,
  toNumber,
} from "../core/utils.js";
import {
  assertAllowedValue,
  assertMatchesPattern,
  HOUSECALL_ENUMS,
  HOUSECALL_PATTERNS,
} from "../core/schema-rules.js";

const PRICE_FORMS_PATH = "/api/price_book/price_forms";

export async function runPriceFormsCommand(args) {
  const [action, ...rest] = args.positionals;
  const { resolved } = await loadResolvedConfig();
  const client = new HousecallClient(resolved);

  switch (action) {
    case "list": {
      const payload = await client.request({
        method: "GET",
        path: PRICE_FORMS_PATH,
        query: buildPriceFormsListQuery(args.flags),
      });
      printJson(payload);
      return;
    }

    case "get": {
      const priceFormId = rest[0];

      if (!priceFormId) {
        throw new Error("Usage: housecall price-forms get <price_form_id>");
      }

      const payload = await client.request({
        method: "GET",
        path: `${PRICE_FORMS_PATH}/${priceFormId}`,
      });
      printJson(payload);
      return;
    }

    case "create": {
      const body = await buildPriceFormCreateBody(args.flags);
      const payload = await client.request({
        method: "POST",
        path: PRICE_FORMS_PATH,
        body,
      });
      printJson(payload);
      return;
    }

    case "update": {
      const priceFormId = rest[0];

      if (!priceFormId) {
        throw new Error(
          "Usage: housecall price-forms update <price_form_id> --data @price-form-update.json",
        );
      }

      const body = await buildPriceFormUpdateBody(args.flags);
      const payload = await client.request({
        method: "PUT",
        path: `${PRICE_FORMS_PATH}/${priceFormId}`,
        body,
      });
      printJson(payload);
      return;
    }

    default:
      throw new Error(`Unknown price-forms command: ${action}`);
  }
}

export async function buildPriceFormCreateBody(flags) {
  const body = await buildPriceFormBody(flags);
  validateRequiredFields(body, ["name"], "price form");
  return body;
}

export async function buildPriceFormUpdateBody(flags) {
  const body = await buildPriceFormBody(flags);

  if (Object.keys(body).length === 0) {
    throw new Error("Price form update requires at least one field.");
  }

  return body;
}

export function buildPriceFormsListQuery(flags) {
  return pickDefined({
    page: toNumber(flags.page),
    page_size: toNumber(flags.page_size),
  });
}

async function buildPriceFormBody(flags) {
  const inputData = await loadJsonInput(flags.data);

  const body = mergeObjects(
    pickDefined({
      name: flags.name,
      description: flags.description,
      automatically_add_to_new_job: toBoolean(flags.automatically_add_to_new_job),
      taxable: toBoolean(flags.taxable),
      olb_enabled: toBoolean(flags.olb_enabled),
      duration_in_minutes: toNumber(flags.duration_in_minutes),
      image: flags.image,
      dynamic_duration_enabled: toBoolean(flags.dynamic_duration_enabled),
      bookable_as: flags.bookable_as,
      question_1: flags.question_1,
      question_2: flags.question_2,
      service_area_pricing_enabled: toBoolean(flags.service_area_pricing_enabled),
      default_service_zone_id: flags.default_service_zone_id,
      assigned: await loadOptionalJsonValue(flags.assigned),
      fields_attributes: await loadOptionalJsonValue(flags.fields_attributes),
    }),
    inputData,
  );

  validatePriceFormBody(body);

  return body;
}

function validatePriceFormBody(body) {
  assertAllowedValue(
    body.bookable_as,
    HOUSECALL_ENUMS.priceFormBookableAs,
    "price form bookable_as",
  );

  if (body.assigned !== undefined) {
    if (typeof body.assigned !== "object" || Array.isArray(body.assigned) || body.assigned === null) {
      throw new Error("price form assigned must be an object.");
    }

    if (
      body.assigned.pros !== undefined &&
      !Array.isArray(body.assigned.pros)
    ) {
      throw new Error("price form assigned.pros must be an array.");
    }

    if (
      body.assigned.tags !== undefined &&
      !Array.isArray(body.assigned.tags)
    ) {
      throw new Error("price form assigned.tags must be an array.");
    }
  }

  if (body.fields_attributes !== undefined && !Array.isArray(body.fields_attributes)) {
    throw new Error("price form fields_attributes must be an array.");
  }

  for (const [fieldIndex, field] of (body.fields_attributes ?? []).entries()) {
    assertMatchesPattern(
      field?.id,
      HOUSECALL_PATTERNS.priceFormFieldId,
      `fields_attributes[${fieldIndex}].id`,
    );

    if (
      field?.options_attributes !== undefined &&
      !Array.isArray(field.options_attributes)
    ) {
      throw new Error(
        `fields_attributes[${fieldIndex}].options_attributes must be an array.`,
      );
    }

    if (
      field?.service_area_fields_attributes !== undefined &&
      !Array.isArray(field.service_area_fields_attributes)
    ) {
      throw new Error(
        `fields_attributes[${fieldIndex}].service_area_fields_attributes must be an array.`,
      );
    }

    for (const [serviceAreaIndex, serviceAreaField] of (
      field?.service_area_fields_attributes ?? []
    ).entries()) {
      if (
        serviceAreaField?.service_area_field_options_attributes !== undefined &&
        !Array.isArray(serviceAreaField.service_area_field_options_attributes)
      ) {
        throw new Error(
          `fields_attributes[${fieldIndex}].service_area_fields_attributes[${serviceAreaIndex}].service_area_field_options_attributes must be an array.`,
        );
      }
    }
  }
}

function validateRequiredFields(body, fields, label) {
  const missingFields = fields.filter((field) => {
    const value = body?.[field];
    return value === undefined || value === null || value === "";
  });

  if (missingFields.length > 0) {
    throw new Error(`Missing required ${label} fields: ${missingFields.join(", ")}`);
  }
}
