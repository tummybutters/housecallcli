# Housecall CLI

Small, agent-friendly CLI for Housecall Pro's API.

The goal is to make Housecall usable from Codex, Claude, and lightweight operator workflows without forcing every model to hand-roll headers, token refresh logic, or raw curl commands.

## What exists now

- Exact Housecall auth header handling for API keys and OAuth bearer tokens
- Local config storage at `~/.config/housecallcli/config.json`
- OAuth helper commands for authorize URL generation, code exchange, and token refresh
- Shared schema catalog at `docs/housecall-schema-catalog.md` for durable object/enums reference
- First-class commands for:
  - `customers`
  - `customers addresses`
  - `employees`
  - `checklists`
  - `estimates`
  - `estimates options`
  - `jobs`
  - `jobs line-items`
  - `jobs schedule`
  - `job-types`
  - `lead-sources`
  - `leads`
  - `pipeline-statuses`
  - `routes`
  - `company`
  - `invoices`
- Generic `api` command for unsupported endpoints while the CLI grows

## Quick start

```bash
npm link
housecall auth api-key YOUR_API_KEY
housecall customers list --page 1 --page-size 10
```

Or use environment variables:

```bash
export HOUSECALL_API_KEY=YOUR_API_KEY
housecall customers list --q "Jane"
```

## Auth

### API key

Housecall expects the `Authorization` header to be exactly:

```text
Authorization: Token YOUR_API_KEY
```

Set it once:

```bash
housecall auth api-key YOUR_API_KEY
```

### OAuth

Official integration partners can use OAuth.

1. Generate the authorize URL:

```bash
housecall auth oauth-url \
  --client-id YOUR_CLIENT_ID \
  --redirect-uri https://YOUR_APP/callback \
  --scope public
```

2. Exchange the returned code:

```bash
housecall auth oauth-exchange \
  --client-id YOUR_CLIENT_ID \
  --client-secret YOUR_CLIENT_SECRET \
  --redirect-uri https://YOUR_APP/callback \
  --code AUTHORIZATION_CODE
```

3. Refresh when needed:

```bash
housecall auth oauth-refresh
```

If refresh credentials are stored, the CLI will also attempt one automatic refresh when a bearer token gets a `401`.

## Examples

### Customers

```bash
housecall customers list --q "acme" --expand attachments
housecall customers get cus_123 --expand attachments,do_not_service
housecall customers create --data @./examples/customer.json
housecall customers update cus_123 --data '{"notes":"VIP account"}'
```

### Customer addresses

```bash
housecall customers addresses list cus_123
housecall customers addresses get cus_123 addr_456
housecall customers addresses create cus_123 --data @./examples/address.json
```

### Employees

```bash
housecall employees list --page 1 --page-size 50
```

### Checklists

```bash
housecall checklists list --job-uuid job_123
housecall checklists list --estimate-uuid est_123,est_456
```

### Estimates

```bash
housecall estimates list --customer-id cus_123 --work-status scheduled,completed
housecall estimates get est_123 --expand attachments
housecall estimates create --data @./examples/estimate.json
```

### Estimate options

```bash
housecall estimates options create est_123 --data @./examples/estimate-option.json
housecall estimates options attachments create est_123 opt_456 --file ./proposal.pdf
housecall estimates options line-items list est_123 opt_456
housecall estimates options line-items bulk-update est_123 opt_456 --data @./examples/estimate-line-items.json
housecall estimates options links create est_123 opt_456 --title "Spec Sheet" --url "https://example.com/spec"
housecall estimates options schedule update est_123 opt_456 --data @./examples/estimate-schedule.json
housecall estimates options notes create est_123 opt_456 --content "Waiting on customer approval"
housecall estimates options notes delete est_123 opt_456 note_789
housecall estimates options approve --option-ids opt_456,opt_457
housecall estimates options decline --option-ids opt_456,opt_457
```

### Jobs

```bash
housecall jobs list --customer-id cus_123 --expand attachments,appointments
housecall jobs get job_123 --expand attachments
housecall jobs create --data @./examples/job.json
housecall jobs attachments create job_123 --file ./before-photo.jpg
housecall jobs dispatch job_123 --employee-ids emp_1,emp_2
housecall jobs lock job_123
housecall jobs lock-range --data @./examples/job-lock-range.json
```

### Job line items and schedule

```bash
housecall jobs line-items list job_123
housecall jobs line-items create job_123 --data @./examples/job-line-item.json
housecall jobs line-items bulk-update job_123 --data @./examples/job-line-items-bulk.json
housecall jobs schedule update job_123 --data @./examples/job-schedule.json
housecall jobs schedule delete job_123
```

### Job appointments and invoices

```bash
housecall jobs appointments list job_123
housecall jobs appointments create job_123 --data @./examples/job-appointment.json
housecall jobs appointments update job_123 appt_456 --data @./examples/job-appointment.json
housecall jobs appointments delete job_123 appt_456
housecall jobs invoices list job_123
```

### Job notes, tags, links, and materials

```bash
housecall jobs notes create job_123 --content "Customer approved onsite upsell"
housecall jobs tags add job_123 tag_456
housecall jobs links create job_123 --title "Warranty" --url "https://example.com/warranty"
housecall jobs input-materials bulk-update job_123 --data @./examples/job-input-materials.json
```

### Job types and lead sources

```bash
housecall job-types list --name "Maintenance"
housecall job-types create --name "Install"
housecall lead-sources list --q "Google"
housecall lead-sources create --name "Referral"
```

### Leads

```bash
housecall leads list --status open --employee-ids emp_1,emp_2
housecall leads get lead_123
housecall leads create --data @./examples/lead.json
housecall leads convert lead_123 --type estimate
housecall leads line-items list lead_123
```

### Pipeline, routes, and company

```bash
housecall pipeline-statuses list --resource-type lead
housecall pipeline-statuses update --data @./examples/pipeline-status-update.json
housecall routes list --date 2026-04-14
housecall company get
housecall company schedule-windows get
housecall company schedule-windows update --data @./examples/company-schedule-windows.json
housecall company booking-windows list --show-for-days 7 --service-duration 60
```

### Invoices

```bash
housecall invoices list --status open,paid --sort-by due_at
housecall invoices get inv_123
housecall invoices preview inv_123
```

### Generic fallback

```bash
housecall api GET /customers --query q=Jane --query page=1
housecall api POST /customers --data @customer.json
```

## Design direction

This repo is intentionally starting with:

- zero runtime dependencies
- JSON-first stdout for easy agent consumption
- a thin command layer over documented endpoints
- a generic fallback command so docs can be translated into usable commands incrementally

As more docs come in, the next step is expanding resources like invoices, payments, and appointments into first-class commands with validation.
