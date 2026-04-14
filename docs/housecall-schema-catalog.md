# Housecall Schema Catalog

Shared schema notes captured from pasted Stoplight schema definitions. This file is the durable reference layer for common objects and enum rules so future CLI work does not have to reconstruct them from endpoint prose.

## Purpose

- Preserve shared object structure across endpoint families
- Record enum values and conditional requirements
- Make future endpoint additions more accurate and faster
- Give agents a single place to recover context if thread history gets long

## Coverage Status

Current coverage is partial and based on pasted schema blocks, not a full OpenAPI export.

Covered shared objects:

- `ErrorResponse`
- `Checklist`
- `ChecklistSection`
- `ChecklistSelectOption`
- `TextChecklistItem`
- `BooleanChecklistItem`
- `MultiSelectChecklistItem`
- `SingleSelectChecklistItem`
- `PassFlagFailChecklistItem`
- `MediaUploadChecklistItem`
- `CustomerCreate`
- `CustomerUpdate`
- `Customer`
- `Address`
- `AddressCreate`
- `Material`
- `MaterialCategory`
- `Note`
- `Tag`
- `Phone`
- `Attachment`
- `DispatchedEmployee`
- `Employee`
- `Event`
- `Schedule`
- `Appointment`
- `CreateAppointment`
- `Job`
- `JobCreate`
- `JobInputMaterial`
- `JobLinkCreate`
- `JobLink`
- `JobInvoice`
- `InvoiceItem`
- `InvoiceTax`
- `InvoiceDiscount`
- `InvoicePayment`
- `LockJobsByTimeRangeRequest`
- `PaginatedList`
- `LineItem`
- `LineItemCreate`
- `JobLineItemCreate`
- `BulkLineItemUpdate`
- `LineItemReponse`
- `LineItemDeletedResponse`
- `PriceForm`
- `PriceFormField`
- `PriceFormFieldOption`
- `PriceFormCreateField`
- `PriceFormCreateOption`
- `PriceFormCreateServiceAreaField`
- `PriceFormCreateServiceAreaFieldOption`
- `PriceFormAssignedInput`
- `PriceFormAssignedProInput`
- `Estimate`
- `Estimate Option`
- `EstimateOptionCreate`
- `LeadsCreate`
- `Lead`
- `LeadSource`
- `JobType`
- `Route`
- `PipelineStatus`
- `PipelineStatusUpdate`
- `PriceFormCreate`
- `PriceFormResponse`
- `PriceFormResponseField`
- `PriceFormResponseOption`
- `PriceFormResponseServiceAreaField`
- `PriceFormResponseServiceAreaFieldOption`
- `PriceFormResponseAssignedPro`
- `PriceFormListResponse`
- `PricebookServiceList`
- `PricebookService`
- `PricebookServiceMaterialList`
- `PricebookServiceMaterial`
- `PricebookServiceLaborRateList`
- `PricebookServiceLaborRate`
- `PricebookLaborRate`
- `PricebookServiceAssignedProList`
- `PricebookServiceAssignedPro`
- `PricebookServiceCategory`
- `PricebookServiceIndustry`
- `Work Timestamps`
- `Company`
- `ServiceAreasData`
- `ServiceZoneResponse`
- `ServiceZoneCity`
- `ServiceZoneServicePro`
- `BookingWindows`
- complete schedule availability read shape
- complete schedule availability update shape

Remaining gaps to collect or clarify next:

- route `job_appointments[]` item shape remains undocumented in pasted docs
- update docs have a likely typo/inconsistency for field kind:
  - `multiple select` in one place vs underscore-style enums elsewhere
- update docs mention special option semantics for numerical range fields, but the accepted-value wording is not fully clean

## Shared Enums

### Address types

- `billing`
- `service`

### Job expand options

- `attachments`
- `appointments`

### Customer expand options

- `attachments`
- `do_not_service`

### Estimate expand options

- `attachments`

### Job work status filter values

- `unscheduled`
- `scheduled`
- `in_progress`
- `completed`
- `canceled`

### Job work status response values

- `needs scheduling`
- `scheduled`
- `in progress`
- `complete rated`
- `complete unrated`
- `user canceled`
- `pro canceled`

### Lead status values

- `lost`
- `open`
- `won`

### Checklist item types captured

- `text`
- `checkbox`
- `multi_select`
- `single_select`
- `media_upload`

Schema note:

- `PassFlagFailChecklistItem` is described as a distinct variant but the pasted schema still shows `type: text`.

### Line item kinds

- `materials`
- `labor`
- `fixed gratuity`
- `fixed discount`
- `percent discount`

### Lead create line item kinds

- `labor`
- `materials`
- `fixed discount`
- `percent discount`

### Service item types

- `market_place`
- `organizational`
- `pricebook_material`

### Pipeline resource types

- `lead`
- `job`
- `estimate`

### Price form bookable_as values

- `jobs`
- `estimates`

### Lead conversion targets

- `estimate`
- `job`

### Invoice payment methods

- `consumer_financing`
- `credit_card`
- `ach`
- `external`
- `mobile_check_deposit`

### Invoice statuses

- `open`
- `pending_payment`
- `paid`
- `voided`
- `uncollectible`
- `canceled`

### Pricebook object discriminator values

- `service`
- `list`
- `service_material`
- `service_labor_rate`
- `labor_rate`
- `assigned_pro`

## Shared Objects

### ErrorResponse

```json
{
  "error": {
    "message": "string"
  }
}
```

### Address

- `id: string`
- `type: billing | service`
- `street?: string | null`
- `street_line_2?: string | null`
- `city?: string | null`
- `state?: string | null`
- `zip?: string | null`
- `country?: string | null`

### AddressCreate

- `street: string`
- `street_line_2?: string | null`
- `city: string`
- `state: string`
- `zip: string`
- `country: string`
- `latitude?: number | string`
- `longitude?: number | string`

### Material

- `object: string`
- `uuid: string`
- `material_category_uuid: string`
- `name: string`
- `description: string`
- `image: string`
- `cost: integer`
- `unit_of_measure: string`
- `part_number: string`
- `price: integer`
- `flat_rate_enabled: boolean`
- `material_category_name: string`
- `taxable: boolean`

### MaterialCategory

- `object: string`
- `uuid: string`
- `parent_uuid?: string | null`
- `name: string`
- `image: string`

### Note

- `id: string`
- `content: string`

### Tag

- `id: string`
- `name: string`

### Attachment

- `id: string`
- `file_name: string`
- `url: string`
- `file_type: string`

### DispatchedEmployee

- `employee_id: string`

### Employee

- `id: string`
- `first_name: string`
- `last_name: string`
- `email: string`
- `mobile_number: string`
- `color_hex: string`
- `avatar_url: string`
- `role: string`
- `created_at: string`
- `tags: string[]`
- `permissions: object`
- `company_name: string`
- `company_id: string`

Permission keys captured so far:

- `can_add_and_edit_job`
- `can_be_booked_online`
- `can_call_and_text_with_customers`
- `can_chat_with_customers`
- `can_delete_and_cancel_job`
- `can_edit_message_on_invoice`
- `can_see_street_view_data`
- `can_share_job`
- `can_take_payment_see_prices`
- `can_see_customers`
- `can_see_full_schedule`
- `can_see_future_jobs`
- `can_see_marketing_campaigns`
- `can_see_reporting`
- `can_edit_settings`
- `is_point_of_contact`
- `is_admin`

### Event

- `id: string`
- `name: string`
- `note?: string | null`
- `tags: string[]`
- `recurrence_rule?: string | null`
  - iCal recurrence string when present
- `address: { street, street_line_2, city, state, zip }`
- `assigned_employees: Employee[]`
- `schedule: { start_time, end_time, time_zone }`
- `all_day: boolean`
- `created_at: string`
- `updated_at: string`

Schema note:

- The prose schema says `assigned_employees` is `array[Employee]`, but the example payload shows a single object. Treat the array form as canonical unless future docs say otherwise.

### CustomerCreate

- optional identity fields:
  - `first_name`
  - `last_name`
  - `email`
  - `mobile_number`
  - `home_number`
  - `work_number`
- optional metadata:
  - `company`
  - `notifications_enabled`
  - `tags`
  - `lead_source`
  - `notes`
  - `addresses: AddressCreate[]`

### CustomerUpdate

Same writable fields as `CustomerCreate` except addresses are not included in the current pasted schema.

### Customer

- `id: string`
- `first_name?: string | null`
- `last_name?: string | null`
- `email?: string | null`
- `mobile_number?: string | null`
- `home_number?: string | null`
- `work_number?: string | null`
- `company?: string | null`
- `notifications_enabled: boolean`
- `lead_source?: string | null`
- `notes?: string | null`
- `created_at: string`
- `updated_at: string`
- `company_name: string`
- `company_id: string`
- `tags: string[]`
- `addresses: Address[]`
- `attachments?: Attachment[]`
- `do_not_service?: boolean`

### LeadsCreate

- `customer_id?: string`
- `customer?: object`
  - same core fields as `CustomerCreate`
  - `addresses` is present but the pasted item shape was not expanded; likely `AddressCreate[]`
- `assigned_employee_id?: string`
- `address_id?: string`
- `address?: { city, state, street, street_line_2, zip }`
- `lead_source?: string`
- `line_items?: array`
  - item fields:
    - `description?: string`
    - `kind?: labor | materials | fixed discount | percent discount`
    - `name: string`
    - `quantity?: number`
    - `unit_cost?: integer`
    - `unit_price?: integer`
- `note?: string`
- `tags?: string[]`
- `tax_name?: string`
- `tax_rate?: integer`

Schema notes:

- Either `customer_id` or `customer` is required.
- `quantity` is described as `integer`, but the prose says it may be a float with up to two decimal places. Treat it as numeric until clearer docs arrive.

### Lead

- `id: string`
- `number: integer`
- `customer: object`
  - `id: string`
  - `first_name?: string | null`
  - `last_name?: string | null`
  - `email?: string | null`
  - `company?: string | null`
  - `notifications_enabled: boolean`
  - `mobile_number?: string | null`
  - `home_number?: string | null`
  - `work_number?: string | null`
  - `tags: string[]`
  - `lead_source?: string | null`
- `address: { id, city, state, street, street_line_2, zip }`
- `lead_source: string`
- `tags: string[]`
- `assigned_employee: Employee`
- `status: lost | open | won`
- `pipeline_status: string`
- `company_name: string`
- `company_id: string`
- `lost_at?: string<date-time> | null`

### Checklist

- `id: string`
- `title: string`
- `job_uuid: string`
- `estimate_uuid: string`
- `sections: ChecklistSection[]`

Checklist item variants currently captured:

- `text`
- `checkbox`
- `multi_select`
- `single_select`
- `media_upload`
- pass/flag/fail variant uses a string value but the pasted description still says `text`

### ChecklistSection

- `title: string`
- `order_index: integer`
- `items: array`
  - may contain:
    - `TextChecklistItem`
    - `BooleanChecklistItem`
    - `MultiSelectChecklistItem`
    - `SingleSelectChecklistItem`
    - `PassFlagFailChecklistItem`
    - `MediaUploadChecklistItem`

### ChecklistSelectOption

- `name: string`
- `value: boolean`
- `order_index: integer`

### TextChecklistItem

- `type: text`
- `title: string`
- `required: boolean`
- `comment: string`
- `order_index: integer`
- `value: string`

### BooleanChecklistItem

- `type: checkbox`
- `title: string`
- `required: boolean`
- `comment: string`
- `order_index: integer`
- `value: boolean`

### MultiSelectChecklistItem

- `type: multi_select`
- `title: string`
- `required: boolean`
- `comment: string`
- `order_index: integer`
- `value: boolean`
- `options: ChecklistSelectOption[]`

### SingleSelectChecklistItem

- `type: single_select`
- `title: string`
- `required: boolean`
- `comment: string`
- `order_index: integer`
- `value: boolean`
- `options: ChecklistSelectOption[]`

### PassFlagFailChecklistItem

- `type: string`
  - pasted example still shows `text`
- `title: string`
- `required: boolean`
- `comment: string`
- `order_index: integer`
- `value: string`

### MediaUploadChecklistItem

- `type: media_upload`
- `title: string`
- `required: boolean`
- `comment: string`
- `order_index: integer`
- `value: boolean`
  - indicates whether attachments have been added
- `attachments: Attachment[]`

### Schedule

- `scheduled_start?: string`
- `scheduled_end?: string`
- `arrival_window?: integer`
- `appointments?: Appointment[]`

### Appointment

- `id: string`
- `start_date: string`
- `start_time: string`
- `end_time: string`
- `anytime: boolean`
- `arrival_window_minutes: integer`
- `dispatched_employees_ids: string[]`

### CreateAppointment

- `start_time: string`
- `end_time: string`
- `arrival_window_minutes?: integer`
- `dispatched_employees_ids: string[]`

### Work Timestamps

- `on_my_way_at?: string | null`
- `started_at?: string | null`
- `completed_at?: string | null`

### LineItem

- `service_item_id?: string`
- `service_item_type?: market_place | organizational | pricebook_material`
- `name: string`
- `unit_price?: number`
- `unit_cost?: number`
- `quantity?: number`
- `kind?: materials | labor | fixed gratuity | fixed discount | percent discount`
- `taxable?: boolean`
- `description?: string`

### BulkLineItemUpdate

Same as `LineItem` plus optional `id`.

### LineItemCreate

Used inside `JobCreate`.

- `name: string`
- `description?: string`
- `unit_price?: number`
- `quantity?: number`
- `unit_cost?: number`
- `pricing_form?: { id, fields[] }`

### PriceForm

Embedded price form subset currently seen inside line items and estimate/job payloads.

- `id: string`
  - pattern: `^pbpf_[a-f0-9]{32}$`
- `fields: PriceFormField[]`

### PriceFormField

- `id: string`
  - pattern: `^pbpff_[a-f0-9]{32}$`
- `value?: number`
- `options?: PriceFormFieldOption[] | null`

### PriceFormFieldOption

- `id: string`
  - pattern: `^pbpffo_[a-f0-9]{32}$`

### PriceFormAssignedProInput

- `uuid: string`
- `full_name: string`

### PriceFormAssignedInput

- `pros: PriceFormAssignedProInput[]`
- `tags: string[]`

### PriceFormCreateOption

- `name: string`
- `price: integer`
- `lower_bound?: integer`
- `upper_bound?: integer`
- `duration_in_minutes?: integer`
- `_destroy?: boolean`

Schema note:

- Update docs mention numerical-range-specific option semantics, but the wording around accepted values is inconsistent. Preserve the fields as documented without over-constraining them in code.

### PriceFormCreateServiceAreaFieldOption

- `price: integer`

### PriceFormCreateServiceAreaField

- `service_zone_id: string`
- `price: integer`
- `service_area_field_options_attributes: PriceFormCreateServiceAreaFieldOption[]`

### PriceFormCreateField

- `name: string`
- `kind: string`
- `id?: string`
- `price: integer`
- `order_index: integer`
- `duration_in_minutes: integer`
- `_destroy?: boolean`
- `options_attributes: PriceFormCreateOption[]`
- `service_area_fields_attributes: PriceFormCreateServiceAreaField[]`

Update docs list accepted `kind` values as:

- `single_select`
- `multiple select`
- `quantity_select`
- `numerical_range`

### PriceFormCreate

- `name: string`
- `description?: string`
- `automatically_add_to_new_job?: boolean`
- `taxable?: boolean`
- `olb_enabled?: boolean`
- `duration_in_minutes?: integer`
- `image?: string`
- `dynamic_duration_enabled?: boolean`
- `bookable_as?: string`
- `question_1?: string`
- `question_2?: string`
- `service_area_pricing_enabled?: boolean`
- `default_service_zone_id?: string`
- `assigned?: PriceFormAssignedInput`
- `fields_attributes?: PriceFormCreateField[]`

Required fields confirmed so far:

- `name`

### PriceFormResponse

- `id: string<uuid>`
  - pattern: `^pbpf_[a-f0-9]{32}$`
- `name: string`
- `automatically_add_to_new_job: boolean`
- `olb_enabled: boolean`
- `duration_in_minutes: integer`
- `taxable: boolean`
- `template_type: string`
- `description: string`
- `dynamic_duration_enabled: boolean`
- `order_index: integer`
- `question_1: string`
- `question_2: string`
- `bookable_as: string`
- `service_area_pricing_enabled: boolean`
- `image_url: string`
- `fields: object`
  - `data: PriceFormResponseField[]`

Schema note:

- Top-level price form responses use `fields.data[]`, while embedded pricing form payloads in line items use `fields[]` directly. Keep those shapes separate.

### PriceFormResponseOption

- `id: string<uuid>`
  - pattern: `^pbpffo_[a-f0-9]{32}$`
- `name: string`
- `price: integer`
- `upper_bound?: integer`
- `lower_bound?: integer`
- `duration_in_minutes?: integer`
- `uuid: string`

### PriceFormResponseServiceAreaFieldOption

- `price: integer`
- `price_form_field_option_id: string`
  - pattern: `^pbpffo_[a-f0-9]{32}$`

### PriceFormResponseServiceAreaField

- `price: integer`
- `service_zone_id: string<uuid>`
- `service_area_field_options: object`
  - `data: PriceFormResponseServiceAreaFieldOption[]`

### PriceFormResponseAssignedPro

- `id: string<uuid>`
  - pattern: `^pro_[a-f0-9]{32}$`
- `full_name: string`

### PriceFormResponseField

- `id: string<uuid>`
  - pattern: `^pbpff_[a-f0-9]{32}$`
- `name: string`
- `price: integer`
- `kind: string`
- `order_index: integer`
- `duration_in_minutes: integer`
- `options: object`
  - `data: PriceFormResponseOption[]`
- `service_area_fields: object`
  - `data: PriceFormResponseServiceAreaField[]`
- `assigned_pros: PriceFormResponseAssignedPro[]`
- `assigned_tags: string[]`

### PriceFormListResponse

- `object: list`
- `page: integer`
- `page_size: integer`
- `total_pages_count: integer`
- `total_count: integer`
- `data: PriceFormResponse[]`
- `url: string`

### PricebookServiceCategory

- `id: integer`
- `name: string`

### PricebookServiceIndustry

- `id: integer`
- `name: string`

### PricebookServiceAssignedPro

- `object: assigned_pro`
- `uuid: string`
- `full_name: string`

### PricebookServiceAssignedProList

- `object: list`
- `data: PricebookServiceAssignedPro[]`

### PricebookLaborRate

- `object: labor_rate`
- `uuid: string`
- `name: string`
- `hourly_cost: integer`
- `hourly_price: integer`
- `default: boolean`
- `services_count: integer`

### PricebookServiceLaborRate

- `object: service_labor_rate`
- `number_of_hours: string`
- `labor_rate: PricebookLaborRate`

### PricebookServiceLaborRateList

- `object: list`
- `data: PricebookServiceLaborRate[]`

### PricebookServiceMaterial

- `object: service_material`
- `quantity: number`
- `material: Material`

### PricebookServiceMaterialList

- `object: list`
- `data: PricebookServiceMaterial[]`

### PricebookService

- `object: service`
- `uuid: string`
- `name: string`
- `description?: string | null`
- `task_number?: string | null`
- `image: string`
- `flat_rate_enabled: boolean`
- `service_materials: PricebookServiceMaterialList`
- `service_labor_rates: PricebookServiceLaborRateList`
- `managed_by?: string | null`
- `price: integer`
- `cost: integer`
- `taxable: boolean`
- `unit_of_measure: string`
- `category: PricebookServiceCategory`
- `industry: PricebookServiceIndustry`
- `online_booking_enabled: boolean`
- `duration?: integer`
- `bookable_as?: string`
- `assigned_pros: PricebookServiceAssignedProList`
- `question_1?: string | null`
- `question_2?: string | null`

### PricebookServiceList

- `page: number`
- `page_size: number`
- `total_pages: number`
- `total_items: number`
- `data: PricebookService[]`
- `url: string`

### JobLineItemCreate

Used on job line item endpoints.

- `name: string`
- `description?: string`
- `unit_price?: number`
- `quantity?: number`
- `unit_cost?: number`
- `kind?: enum`
- `taxable?: boolean`
- `service_item_id?: string`
- `service_item_type?: enum`

### LineItemReponse

- `id: string`
- `name: string`
- `description: string`
- `unit_price: number`
- `unit_cost: number`
- `unit_of_measure: string`
- `quantity: number`
- `kind: enum`
- `taxable: boolean`
- `amount: number`
- `order_index: integer`
- `service_item_id: string`
- `service_item_type: enum`

### LineItemDeletedResponse

- `id: string`
- `deleted: boolean`

### JobInputMaterial

- `uuid?: string`
- `name: string`
- `description?: string`
- `part_number?: string`
- `unit_cost?: integer`
- `quantity?: number`

### JobLinkCreate

- `title: string`
- `url: string`

### JobLink

- `id: string`
- `title: string`
- `url: string`

### JobType

- `id: string`
- `name: string`

### LeadSource

- `id: string`
- `name: string`
- `editable: boolean`

### Route

A route groups employees and their scheduled job appointments, events, and estimates for a given date.

- `id: string`
- `name: string`
- `color_hex: string`
- `date: string`
  - format: `YYYY-MM-DD`
- `employee_ids: string[]`
- `job_appointments: object[]`
- `event_ids: string[]`
- `estimate_ids: string[]`

Schema note:

- The route object confirms that `/routes` is not just lightweight metadata; it is the grouping layer for appointments, events, and estimates on a given day.
- The nested `job_appointments[]` item shape is not expanded in the pasted route docs, so keep it opaque unless a later schema block specifies it.

### PipelineStatus

A pipeline status for lead, job, or estimate.

- `id: string`
- `name: string`
- `status_type: string`

### PipelineStatusUpdate

Request body for updating pipeline status.

- `resource_type: lead | job | estimate`
- `resource_id: string`
- `status_id: string`

### LockJobsByTimeRangeRequest

- `starting_at: string<date-time>`
- `ending_at: string<date-time>`

### PaginatedList

- `page: number`
- `page_size: number`
- `total_pages: number`
- `total_items: number`

### JobCreate

- `customer_id: string`
- `address_id: string`
- `invoice_number?: number`
- `schedule?: { scheduled_start, scheduled_end, arrival_window, anytime, anytime_start_date }`
- `assigned_employee_ids?: string[]`
- `line_items?: LineItemCreate[]`
- `tags?: string[]`
- `lead_source?: string`
- `notes?: string`
- `job_fields?: { job_type_id, business_unit_id }`

If `line_items[].pricing_form` is provided:

- `pricing_form.id` must match `^pbpf_[a-f0-9]{32}$`
- `pricing_form.fields[].id` must match `^pbpff_[a-f0-9]{32}$`
- `pricing_form.fields[].options[].id` must match `^pbpffo_[a-f0-9]{32}$`

### Job

Important nested shared objects confirmed:

- `customer: Customer-like object`
- `address: Address`
- `notes: Note[]`
- `work_timestamps: object`
- `schedule: Schedule`
- `assigned_employees: Employee[]`
- `job_fields.job_type: JobType`
- `job_fields.business_unit: JobType`
- `attachments?: Attachment[]`

### InvoiceItem

- `id: string`
- `name: string`
- `unit_cost: integer`
- `unit_price: integer`
- `qty_in_hundredths: integer`
- `amount: integer`
- `description: string`
- `type: string`

### InvoiceTax

- `id: string`
- `rate: integer`
- `amount: integer`
- `name: string`

### InvoiceDiscount

- `id: string`
- `amount: integer`
- `name: string`
- `description: string`

### InvoicePayment

- `id: string`
- `status: string`
- `payment_method: string`
- `amount: integer`
- `note: string`
- `paid_at: string`
- `category: string`

### JobInvoice

- `id: string`
- `status: string`
- `invoice_number: string`
- `amount: integer`
- `subtotal: integer`
- `due_amount: integer`
- `due_at: string`
- `display_due_concept: string`
- `due_concept: string`
- `paid_at: string`
- `sent_at: string`
- `service_date: string`
- `invoice_date: string`
- `items: InvoiceItem[]`
- `taxes: InvoiceTax[]`
- `discounts: InvoiceDiscount[]`
- `payments: InvoicePayment[]`

### EstimateOptionCreate

- `name: string`
- `line_items?: array`
  - item fields:
    - `name`
    - `description`
    - `unit_price`
    - `unit_cost`
    - `quantity`
    - `taxable`
- `tax?: { taxable, tax_rate, tax_name }`

When `tax.taxable = true`:

- `tax_rate` is required
- `tax_name` is required

### Estimate

Important nested shared objects confirmed:

- `customer: Customer-like object`
- `address: Address`
- `work_timestamps: Work Timestamps`
- `schedule: Schedule`
- `assigned_employees: Employee[]`
- `estimate_fields: { job_type_id, business_unit_id }`
- `options: Estimate Option[]`

### Estimate Option

- `id: string`
- `name: string`
- `option_number: string`
- `total_amount: integer`
- `approval_status: string`
- `message_from_pro: string`
- `tags: string[]`
- `status: string`
- `notes: Note[]`
- `created_at: string`
- `updated_at: string`
- `attachments?: Attachment[]`

### Company

- `id: string`
- `name: string`
- `support_email: string`
- `phone_number: string`
- `logo_url: string`
- `address: AddressCreate`
- `website: string`
- `default_arrival_window: string`
- `time_zone: string`
- `service_areas_data: ServiceAreasData`
- `locations: Company[]`

### ServiceAreasData

- `zip_codes: string[]`

### ServiceZoneCity

- `city: string`
- `state: string`
- `country: string`

### ServiceZoneServicePro

- `id: string`
- `first_name: string`
- `last_name: string`
- `email: string`
- `full_name: string`

### ServiceZoneResponse

- `id: string<uuid>`
- `name: string`
- `coverage_type: string`
- `trip_charge: integer`
- `fee_name: string`
- `zip_codes: string[]`
- `cities: ServiceZoneCity[]`
- `service_pros: ServiceZoneServicePro[]`

### BookingWindows

- `booking_windows: array`
  - item fields:
    - `start_time: string`
    - `end_time: string`
    - `available: boolean`
- `show_for_days: integer`
- `start_date: string`

### Complete schedule availability read shape

- `availability_buffer_in_days: number`
- `daily_availabilities.data: array`

### Complete schedule availability update shape

- `availability_buffer_in_days: number`
- `daily_schedule_windows: array`
  - `day_name: string`
  - `schedule_windows: array`
    - `start_time: string`
    - `end_time: string`

## Conditional Requirements

- `Create customer`: at least one customer identity field is required by endpoint docs
- `PriceFormCreate.name` is required
- `PriceForm.bookable_as` accepts:
  - `jobs`
  - `estimates`
- `JobCreate.schedule.anytime_start_date` is required when `schedule.anytime = true`
- `JobCreate.line_items[].pricing_form.id` must match `pbpf_...` pattern when provided
- `Job appointments create/update`: `start_time`, `end_time`, and `dispatched_employees_ids` are required
- `Pipeline status list`: `resource_type` is required
- `Pipeline status update`: `resource_type`, `resource_id`, and `status_id` are required
- `Lead create`: either `customer_id` or `customer` is required
- `Lead line_items[].kind` is a narrower enum than the shared line item model:
  - `labor`
  - `materials`
  - `fixed discount`
  - `percent discount`
- `Lead convert`: `type` must be `estimate` or `job`
- `Estimate tax.tax_rate` and `tax.tax_name` are required when `tax.taxable = true`
- `Estimate option tax.tax_rate` and `tax.tax_name` are required when `tax.taxable = true`
- `Company schedule windows update` requires `day_name`, `schedule_windows`, `start_time`, and `end_time` in each day config

## Codified In CLI

The CLI currently codifies a subset of these schema rules in code:

- enum validation for pipeline resource types
- enum validation for invoice filters
- enum validation for line item kinds and service item types
- enum validation for lead create line item kinds
- enum validation for price form `bookable_as`
- enum validation for job, estimate, customer, and lead filter fields where docs are clear
- conditional requirement for `JobCreate.schedule.anytime_start_date`
- pattern validation for `fields_attributes[].id` in price form update/create payloads when present
- conditional requirements for lead create customer reference and appointment create fields

As more schema dumps come in, extend this file first, then tighten command validation second.
