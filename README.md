# Housecall CLI

Small, agent-friendly CLI for Housecall Pro's API.

The goal is to make Housecall usable from Codex, Claude, and lightweight operator workflows without forcing every model to hand-roll headers, token refresh logic, or raw curl commands.

## Design

- Zero runtime dependencies -- pure Node.js built-ins only
- JSON-first stdout for easy agent consumption
- Thin command layer over documented endpoints with input validation
- Generic `api` fallback for any endpoint not yet wrapped as a first-class command

## What's implemented

### Full CRUD

| Resource | Actions |
|----------|---------|
| `customers` | list, get, create, update |
| `customers addresses` | list, get, create |
| `estimates` | list, get, create |
| `estimates options` | create, attachments, line-items, links, schedule, notes, approve, decline |
| `jobs` | list, get, create + 20 subcommands (see below) |
| `job-types` | list, create, update |
| `lead-sources` | list, create, update |
| `leads` | list, get, create, convert, line-items |
| `price-forms` | list, get, create, update |
| `pipeline-statuses` | list, update |

### Read-only

| Resource | Actions |
|----------|---------|
| `invoices` | list, get, preview |
| `employees` | list |
| `checklists` | list |
| `routes` | list |
| `company` | get, schedule-windows, booking-windows |

### Jobs subcommands

Jobs is the largest command with full support for:

- `line-items` -- list, create, bulk-update, update, delete
- `schedule` -- update, delete
- `appointments` -- list, create, update, delete
- `invoices` -- list
- `input-materials` -- list, bulk-update
- `dispatch`, `lock`, `lock-range`
- `tags` -- add, remove
- `notes` -- create, delete
- `links` -- create
- `attachments` -- create

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
housecall jobs line-items update job_123 li_456 --data @./examples/job-line-item.json
housecall jobs line-items delete job_123 li_456
housecall jobs schedule update job_123 --data @./examples/job-schedule.json
housecall jobs schedule delete job_123
```

### Job appointments

```bash
housecall jobs appointments list job_123
housecall jobs appointments create job_123 --data @./examples/job-appointment.json
housecall jobs appointments update job_123 appt_456 --data @./examples/job-appointment.json
housecall jobs appointments delete job_123 appt_456
```

### Job notes, tags, links, and materials

```bash
housecall jobs notes create job_123 --content "Customer approved onsite upsell"
housecall jobs notes delete job_123 note_456
housecall jobs tags add job_123 tag_456
housecall jobs tags remove job_123 tag_456
housecall jobs links create job_123 --title "Warranty" --url "https://example.com/warranty"
housecall jobs input-materials list job_123
housecall jobs input-materials bulk-update job_123 --data @./examples/job-input-materials.json
housecall jobs invoices list job_123
```

### Invoices

```bash
housecall invoices list --status open,paid --sort-by due_at
housecall invoices get inv_123
housecall invoices preview inv_123
```

### Price forms

```bash
housecall price-forms list
housecall price-forms get pbpf_abc123
housecall price-forms create --data @./examples/price-form.json
housecall price-forms update pbpf_abc123 --data @./examples/price-form-update.json
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

### Generic fallback

```bash
housecall api GET /customers --query q=Jane --query page=1
housecall api POST /customers --data @customer.json
```

## Data input

Commands accept data in three ways:

- Inline JSON: `--data '{"name":"Acme"}'`
- File reference: `--data @./examples/customer.json`
- Stdin: `--data -` (pipe JSON in)

## Environment variables

| Variable | Purpose |
|----------|---------|
| `HOUSECALL_API_KEY` | API key for Token auth |
| `HOUSECALL_ACCESS_TOKEN` | OAuth bearer token |
| `HOUSECALL_AUTH_MODE` | `token` or `bearer` |
| `HOUSECALL_COMPANY_ID` | Company ID header |
| `HOUSECALL_BASE_URL` | API base URL override |
| `HOUSECALL_CLIENT_ID` | OAuth client ID |
| `HOUSECALL_CLIENT_SECRET` | OAuth client secret |
| `HOUSECALL_REDIRECT_URI` | OAuth redirect URI |
| `HOUSECALL_REFRESH_TOKEN` | OAuth refresh token |
