export const HOUSECALL_ENUMS = {
  addressTypes: ["billing", "service"],
  customerExpand: ["attachments", "do_not_service"],
  jobExpand: ["attachments", "appointments"],
  estimateExpand: ["attachments"],
  jobWorkStatusFilter: [
    "unscheduled",
    "scheduled",
    "in_progress",
    "completed",
    "canceled",
  ],
  jobWorkStatus: [
    "needs scheduling",
    "scheduled",
    "in progress",
    "complete rated",
    "complete unrated",
    "user canceled",
    "pro canceled",
  ],
  leadStatus: ["lost", "open", "won"],
  lineItemKind: [
    "materials",
    "labor",
    "fixed gratuity",
    "fixed discount",
    "percent discount",
  ],
  leadLineItemKind: [
    "labor",
    "materials",
    "fixed discount",
    "percent discount",
  ],
  serviceItemType: ["market_place", "organizational", "pricebook_material"],
  paymentMethod: [
    "consumer_financing",
    "credit_card",
    "ach",
    "external",
    "mobile_check_deposit",
  ],
  invoiceStatus: [
    "open",
    "pending_payment",
    "paid",
    "voided",
    "uncollectible",
    "canceled",
  ],
  pipelineResourceType: ["lead", "job", "estimate"],
  leadConvertType: ["estimate", "job"],
  priceFormBookableAs: ["jobs", "estimates"],
};

export const HOUSECALL_PATTERNS = {
  priceFormId: /^pbpf_[a-f0-9]{32}$/,
  priceFormFieldId: /^pbpff_[a-f0-9]{32}$/,
  priceFormFieldOptionId: /^pbpffo_[a-f0-9]{32}$/,
};

export function assertAllowedValue(value, allowed, label) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  if (!allowed.includes(value)) {
    throw new Error(
      `Invalid ${label}: ${value}. Allowed values: ${allowed.join(", ")}`,
    );
  }
}

export function assertAllowedValues(values, allowed, label) {
  if (!Array.isArray(values) || values.length === 0) {
    return;
  }

  const invalidValues = values.filter((value) => !allowed.includes(value));

  if (invalidValues.length > 0) {
    throw new Error(
      `Invalid ${label}: ${invalidValues.join(", ")}. Allowed values: ${allowed.join(", ")}`,
    );
  }
}

export function assertConditionalRequirement(condition, fieldValue, message) {
  if (condition && (fieldValue === undefined || fieldValue === null || fieldValue === "")) {
    throw new Error(message);
  }
}

export function assertMatchesPattern(value, pattern, label) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  if (!pattern.test(String(value))) {
    throw new Error(`Invalid ${label}: ${value}`);
  }
}

export function validatePriceForm(priceForm, label = "pricing_form") {
  if (priceForm === undefined || priceForm === null) {
    return;
  }

  if (typeof priceForm !== "object" || Array.isArray(priceForm)) {
    throw new Error(`${label} must be an object.`);
  }

  assertMatchesPattern(
    priceForm.id,
    HOUSECALL_PATTERNS.priceFormId,
    `${label}.id`,
  );

  if (!Array.isArray(priceForm.fields)) {
    throw new Error(`${label}.fields must be an array.`);
  }

  for (const [fieldIndex, field] of priceForm.fields.entries()) {
    assertMatchesPattern(
      field?.id,
      HOUSECALL_PATTERNS.priceFormFieldId,
      `${label}.fields[${fieldIndex}].id`,
    );

    if (field?.options === undefined || field?.options === null) {
      continue;
    }

    if (!Array.isArray(field.options)) {
      throw new Error(`${label}.fields[${fieldIndex}].options must be an array.`);
    }

    for (const [optionIndex, option] of field.options.entries()) {
      assertMatchesPattern(
        option?.id,
        HOUSECALL_PATTERNS.priceFormFieldOptionId,
        `${label}.fields[${fieldIndex}].options[${optionIndex}].id`,
      );
    }
  }
}

export function validatePriceFormsInLineItems(lineItems, label) {
  if (!Array.isArray(lineItems)) {
    return;
  }

  for (const [lineItemIndex, lineItem] of lineItems.entries()) {
    validatePriceForm(
      lineItem?.pricing_form,
      `${label}[${lineItemIndex}].pricing_form`,
    );
  }
}

export function validateTaxConfiguration(tax, label = "tax") {
  if (tax === undefined || tax === null) {
    return;
  }

  if (typeof tax !== "object" || Array.isArray(tax)) {
    throw new Error(`${label} must be an object.`);
  }

  assertConditionalRequirement(
    tax.taxable === true,
    tax.tax_rate,
    `${label}.tax_rate is required when ${label}.taxable is true.`,
  );
  assertConditionalRequirement(
    tax.taxable === true,
    tax.tax_name,
    `${label}.tax_name is required when ${label}.taxable is true.`,
  );
}

export function validateCreateAppointment(body, label = "appointment") {
  if (body === undefined || body === null) {
    return;
  }

  if (typeof body !== "object" || Array.isArray(body)) {
    throw new Error(`${label} must be an object.`);
  }

  assertConditionalRequirement(
    true,
    body.start_time,
    `${label}.start_time is required.`,
  );
  assertConditionalRequirement(
    true,
    body.end_time,
    `${label}.end_time is required.`,
  );

  if (
    !Array.isArray(body.dispatched_employees_ids) ||
    body.dispatched_employees_ids.length === 0
  ) {
    throw new Error(
      `${label}.dispatched_employees_ids is required and must be a non-empty array.`,
    );
  }
}

export function validateDailyScheduleWindows(dailyScheduleWindows) {
  if (dailyScheduleWindows === undefined || dailyScheduleWindows === null) {
    return;
  }

  if (!Array.isArray(dailyScheduleWindows)) {
    throw new Error("daily_schedule_windows must be an array.");
  }

  for (const [dayIndex, dayConfig] of dailyScheduleWindows.entries()) {
    assertConditionalRequirement(
      true,
      dayConfig?.day_name,
      `daily_schedule_windows[${dayIndex}].day_name is required.`,
    );

    if (!Array.isArray(dayConfig?.schedule_windows)) {
      throw new Error(
        `daily_schedule_windows[${dayIndex}].schedule_windows must be an array.`,
      );
    }

    for (const [windowIndex, scheduleWindow] of dayConfig.schedule_windows.entries()) {
      assertConditionalRequirement(
        true,
        scheduleWindow?.start_time,
        `daily_schedule_windows[${dayIndex}].schedule_windows[${windowIndex}].start_time is required.`,
      );
      assertConditionalRequirement(
        true,
        scheduleWindow?.end_time,
        `daily_schedule_windows[${dayIndex}].schedule_windows[${windowIndex}].end_time is required.`,
      );
    }
  }
}
