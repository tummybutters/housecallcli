# Housecall API Notes

Seed notes captured from the initial docs drop so the CLI can grow from stable assumptions instead of repeated re-parsing.

For shared object shapes, enums, and conditional schema rules, see `docs/housecall-schema-catalog.md`.

## Authentication

- Housecall supports two auth modes:
  - API key: `Authorization: Token <api_key>`
  - OAuth 2.0: `Authorization: Bearer <access_token>`
- Header prefixes must be exact: `Token` for API keys and `Bearer` for OAuth access tokens.
- OAuth authorize endpoint: `https://pro.housecallpro.com/oauth/authorize`
- OAuth token endpoint: `https://api.housecallpro.com/oauth/token`
- OAuth is for official integration partners only.
- API keys are the default path for Pros or custom integrations.

## OAuth flow details

- Authorization Code Flow only
- Required app setup inputs:
  - application name and purpose
  - redirect URI / callback URL
- Token exchange payload:
  - `client_id`
  - `client_secret`
  - `grant_type=authorization_code`
  - `code`
  - `redirect_uri`
- Refresh payload:
  - `client_id`
  - `client_secret`
  - `grant_type=refresh_token`
  - `refresh_token`
  - `redirect_uri`
- Refresh and exchange responses include:
  - `access_token`
  - `token_type`
  - `expires_in`
  - `refresh_token`
  - `scope`
  - `created_at`

## Initial endpoints mapped into CLI

### Customers

- `GET /customers`
- `POST /customers`
- `GET /customers/{customer_id}`
- `PUT /customers/{customer_id}`
- `GET /customers/{customer_id}/addresses`
- `POST /customers/{customer_id}/addresses`
- `GET /customers/{customer_id}/addresses/{address_id}`

### Employees

- `GET /employees`

### Checklists

- `GET /checklists`

### Estimates

- `GET /estimates`
- `POST /estimates`
- `GET /estimates/{estimate_id}`
- `POST /estimates/{estimate_id}/options`
- `POST /estimates/{estimate_id}/options/{option_id}/attachments`
- `GET /estimates/{estimate_id}/options/{option_id}/line_items`
- `PUT /estimates/{estimate_id}/options/{option_id}/line_items/bulk_update`
- `POST /estimates/{estimate_id}/options/{option_id}/links`
- `PUT /estimates/{estimate_id}/options/{option_id}/schedule`
- `POST /estimates/{estimate_id}/options/{option_id}/notes`
- `DELETE /estimates/{estimate_id}/options/{option_id}/notes/{note_id}`
- `POST /estimates/options/approve`
- `POST /estimates/options/decline`

### Jobs

- `GET /jobs`
- `POST /jobs`
- `GET /jobs/{id}`
- `POST /jobs/{job_id}/attachments`
- `GET /jobs/{job_id}/line_items`
- `POST /jobs/{job_id}/line_items`
- `PUT /jobs/{job_id}/line_items/bulk_update`
- `PUT /jobs/{job_id}/line_items/{id}`
- `DELETE /jobs/{job_id}/line_items/{id}`
- `PUT /jobs/{job_id}/schedule`
- `DELETE /jobs/{job_id}/schedule`
- `GET /jobs/{job_id}/appointments`
- `POST /jobs/{job_id}/appointments`
- `PUT /jobs/{job_id}/appointments/{appointment_id}`
- `DELETE /jobs/{job_id}/appointments/{appointment_id}`
- `PUT /jobs/{job_id}/dispatch`
- `GET /jobs/{job_id}/invoices`
- `GET /jobs/{job_id}/job_input_materials`
- `PUT /jobs/{job_id}/job_input_materials/bulk_update`
- `POST /jobs/{job_id}/tags`
- `DELETE /jobs/{job_id}/tags/{tag_id}`
- `POST /jobs/{job_id}/notes`
- `DELETE /jobs/{job_id}/notes/{note_id}`
- `POST /jobs/{job_id}/links`
- `POST /jobs/{job_id}/lock`
- `POST /jobs/lock`

### Job Types

- `GET /job_fields/job_types`
- `POST /job_fields/job_types`
- `PUT /job_fields/job_types/{job_type_id}`

### Leads

- `GET /leads`
- `POST /leads`
- `GET /leads/{id}`
- `POST /leads/{id}/convert`

### Lead Sources

- `GET /lead_sources`
- `POST /lead_sources`
- `PUT /lead_sources/{lead_source_id}`

### Pipeline Statuses

- `GET /pipeline/statuses`
- `PUT /pipeline/statuses`

### Price Forms

- `GET /api/price_book/price_forms`
- `POST /api/price_book/price_forms`
- `GET /api/price_book/price_forms/{uuid}`
- `PUT /api/price_book/price_forms/{uuid}`

### Routes

- `GET /routes`

### Company

- `GET /company`
- `GET /company/schedule_availability`
- `PUT /company/schedule_availability`
- `GET /company/schedule_availability/booking_windows`

### Invoices

- `GET /invoices`
- `GET /api/invoices/{uuid}`
- `GET /api/invoices/{uuid}/preview`

## Endpoint-specific rules

### Customers list

- Expand options:
  - `attachments`
  - `do_not_service`
- Search query `q` can search name, email, mobile number, and address.

### Create customer

- At least one of the following is required:
  - `first_name`
  - `last_name`
  - `email`
  - `mobile_number`
  - `home_number`
  - `work_number`

### Checklists list

- Requires at least one job UUID or estimate UUID.

### Estimates list

- Expand options:
  - `attachments`
- Supports filters for:
  - `customer_id`
  - `employee_ids`
  - `location_ids`
  - `scheduled_start_min`
  - `scheduled_start_max`
  - `scheduled_end_min`
  - `scheduled_end_max`
  - `work_status`

### Estimate option attachments

- Uses `multipart/form-data`
- Requires a local file upload under field name `file`

### Estimate option bulk line-item update

- If a line item has no `id`, Housecall treats it as a new line item to create.

### Estimate option approvals

- Approval and decline endpoints operate on `option_ids[]`, not estimate IDs.
- Live probe on 2026-04-15 in the BFTP account:
  - created disposable estimate `csr_21847f9f871345d9885775e9dd6a02f1`
  - approved option `est_b92a0e9a66b34cd5ab968a712d925a3a`
  - response returned `status = "pro approved"` and `copied_on_approval_to_job_id = null`
  - polling `/jobs?customer_id=...` for 20 seconds detected no new job
- Practical implication:
  - API estimate approval should not currently be treated as "job created"
  - agents must verify job creation after approval and then explicitly create or escalate when no job appears
- Separate fallback probe on 2026-04-15:
  - explicit `POST /jobs` for the same customer/address succeeded
  - returned job `job_e44ceb0e42944ac9943731f4598c1bfe`
  - `original_estimate_id` was `null`, so the manual fallback job was not linked back to the estimate

### Jobs list

- Expand options:
  - `attachments`
  - `appointments`
- Supports filters for:
  - `customer_id`
  - `employee_ids`
  - `location_ids`
  - `scheduled_start_min`
  - `scheduled_start_max`
  - `scheduled_end_min`
  - `scheduled_end_max`
  - `work_status`

### Create job

- Requires:
  - `customer_id`
  - `address_id`
- `schedule.anytime_start_date` is required if `schedule.anytime` is `true`.

### Job attachments

- Uses `multipart/form-data`
- Requires a local file upload under field name `file`

### Job line items bulk update

- If a line item has no `id`, Housecall treats it as a new line item to create.
- `append_line_items=true` preserves existing line items not included in the request.

### Job schedule updates

- Jobs with multi-day scheduling containing more than one appointment cannot be updated through `/jobs/{job_id}/schedule`; those must use appointments endpoints.

### Job appointments

- Appointment create/update requires:
  - `start_time`
  - `end_time`
  - `dispatched_employees_ids`
- Appointment response objects also expose:
  - `id`
  - `start_date`
  - `anytime`
  - `arrival_window_minutes`
- Use appointments endpoints for multi-day jobs with more than one appointment.

### Job invoices

- Current CLI support is read-only:
  - `GET /jobs/{job_id}/invoices`
- Job invoice payloads include nested:
  - `items`
  - `taxes`
  - `discounts`
  - `payments`

### Job lock operations

- Single lock: `POST /jobs/{job_id}/lock`
- Bulk/range lock: `POST /jobs/lock` with `starting_at` and `ending_at`

### Job types

- Supports optional name filtering on list.
- Create and update require `name`.

### Lead creation

- Requires either:
  - `customer_id`
  - `customer`
- Can optionally include:
  - `assigned_employee_id`
  - `address_id` or `address`
  - `line_items`
  - `note`
  - `tags`
  - `tax_name`
  - `tax_rate`
- Lead create `line_items[].kind` uses a narrower enum than general line items:
  - `labor`
  - `materials`
  - `fixed discount`
  - `percent discount`

### Lead conversion

- `POST /leads/{id}/convert`
- `type` must be either:
  - `estimate`
  - `job`

### Lead sources

- List supports paging and search via `q`.
- Only editable lead sources can be updated according to the docs.

### Pipeline statuses

- List requires `resource_type`:
  - `lead`
  - `job`
  - `estimate`
- Pipeline status objects expose:
  - `id`
  - `name`
  - `status_type`
- Update requires:
  - `resource_type`
  - `resource_id`
  - `status_id`
- Docs note that pipeline moves can only go forward to statuses with equal or higher order.

### Price forms

- Create requires `name`.
- Update accepts `bookable_as` values:
  - `jobs`
  - `estimates`
- Price form responses use:
  - `pbpf_...` ids for the price form
  - `pbpff_...` ids for nested fields
  - `pbpffo_...` ids for nested field options
- List response is paginated and returns:
  - `object`
  - `page`
  - `page_size`
  - `total_pages_count`
  - `total_count`
  - `data`
  - `url`
- Update docs note image handling:
  - use multipart with a file under `image` when uploading a file
  - for JSON-only updates, omit `image` or send `image: null`

### Routes

- List supports:
  - `date`
  - `page`
  - `per_page`
- Route payloads expose:
  - `id`
  - `name`
  - `color_hex`
  - `date`
  - `employee_ids`
  - `job_appointments`
  - `event_ids`
  - `estimate_ids`
- Related event objects expose:
  - `note`
  - `tags`
  - `recurrence_rule`
  - `address`
  - `assigned_employees`
  - `schedule`
  - `all_day`

### Company schedule availability

- Update requires:
  - `availability_buffer_in_days`
  - `daily_schedule_windows`

### Booking windows

- Duration resolution per docs:
  - `service_duration`
  - service duration from `service_id`
  - fallback `30`
- Response payload includes:
  - `booking_windows[]` with `start_time`, `end_time`, and `available`
  - `show_for_days`
  - `start_date`

### Lead line items

- `GET /leads/{lead_id}/line_items`
- Supports paging via `page` and `page_size`

### Invoices

- Global invoice list supports filters for due amount, created/due/paid dates, customer UUIDs, payment methods, location IDs, status, and sort fields.
- Single invoice fetch and preview use the `/api/invoices/{uuid}` path family, not `/invoices/{uuid}`.
