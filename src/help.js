export const HELP_TEXT = `Housecall CLI

Usage:
  housecall <command> [subcommand] [flags]

Core commands:
  housecall auth status
  housecall auth api-key <api_key>
  housecall auth bearer <access_token>
  housecall auth oauth-url --client-id <id> --redirect-uri <uri> [--scope public]
  housecall auth oauth-exchange --client-id <id> --client-secret <secret> --redirect-uri <uri> --code <auth_code>
  housecall auth oauth-refresh --client-id <id> --client-secret <secret> --redirect-uri <uri> --refresh-token <token>

  housecall customers list [--q "Jane"] [--page 1] [--page-size 10]
  housecall customers get <customer_id> [--expand attachments,do_not_service]
  housecall customers create --data @customer.json
  housecall customers update <customer_id> --data @customer-patch.json
  housecall customers addresses list <customer_id>
  housecall customers addresses get <customer_id> <address_id>
  housecall customers addresses create <customer_id> --data @address.json

  housecall employees list [--page 1] [--page-size 10]
  housecall checklists list --job-uuid <uuid>
  housecall estimates list [--customer-id cus_123] [--work-status scheduled,completed]
  housecall estimates get <estimate_id> [--expand attachments]
  housecall estimates create --data @estimate.json
  housecall estimates options create <estimate_id> --data @option.json
  housecall estimates options attachments create <estimate_id> <option_id> --file ./photo.jpg
  housecall estimates options line-items list <estimate_id> <option_id>
  housecall estimates options line-items bulk-update <estimate_id> <option_id> --data @line-items.json
  housecall estimates options links create <estimate_id> <option_id> --title "Brochure" --url "https://..."
  housecall estimates options schedule update <estimate_id> <option_id> --data @schedule.json
  housecall estimates options notes create <estimate_id> <option_id> --content "Internal note"
  housecall estimates options notes delete <estimate_id> <option_id> <note_id>
  housecall estimates options approve --option-ids opt_1,opt_2
  housecall estimates options decline --option-ids opt_1,opt_2
  housecall jobs list [--customer-id cus_123] [--work-status scheduled,in_progress]
  housecall jobs get <job_id> [--expand attachments,appointments]
  housecall jobs create --data @job.json
  housecall jobs attachments create <job_id> --file ./photo.jpg
  housecall jobs line-items list <job_id>
  housecall jobs line-items create <job_id> --data @job-line-item.json
  housecall jobs line-items bulk-update <job_id> --data @job-line-items-bulk.json
  housecall jobs line-items update <job_id> <line_item_id> --data @job-line-item.json
  housecall jobs line-items delete <job_id> <line_item_id>
  housecall jobs schedule update <job_id> --data @job-schedule.json
  housecall jobs schedule delete <job_id>
  housecall jobs appointments list <job_id>
  housecall jobs appointments create <job_id> --data @job-appointment.json
  housecall jobs appointments update <job_id> <appointment_id> --data @job-appointment.json
  housecall jobs appointments delete <job_id> <appointment_id>
  housecall jobs dispatch <job_id> --employee-ids emp_1,emp_2
  housecall jobs invoices list <job_id>
  housecall jobs input-materials list <job_id>
  housecall jobs input-materials bulk-update <job_id> --data @job-input-materials.json
  housecall jobs tags add <job_id> <tag_id>
  housecall jobs tags remove <job_id> <tag_id>
  housecall jobs notes create <job_id> --content "On site now"
  housecall jobs notes delete <job_id> <note_id>
  housecall jobs links create <job_id> --title "Permit" --url "https://..."
  housecall jobs lock <job_id>
  housecall jobs lock-range --starting-at 2026-04-14T00:00:00Z --ending-at 2026-04-14T23:59:59Z
  housecall job-types list [--name "Maintenance"]
  housecall job-types create --name "Install"
  housecall job-types update <job_type_id> --name "Repair"
  housecall lead-sources list [--q "Google"] [--page 1] [--page-size 10]
  housecall lead-sources create --name "Referral"
  housecall lead-sources update <lead_source_id> --name "Website Form"
  housecall leads list [--status open] [--employee-ids emp_1,emp_2]
  housecall leads get <lead_id>
  housecall leads create --data @lead.json
  housecall leads convert <lead_id> --type estimate|job
  housecall leads line-items list <lead_id>
  housecall pipeline-statuses list --resource-type lead|job|estimate
  housecall pipeline-statuses update --resource-type lead --resource-id lead_123 --status-id kcs_456
  housecall price-forms list
  housecall price-forms get <price_form_id>
  housecall price-forms create --data @price-form.json
  housecall price-forms update <price_form_id> --data @price-form-update.json
  housecall routes list [--date 2026-04-14] [--per-page 10]
  housecall company get
  housecall company schedule-windows get
  housecall company schedule-windows update --data @company-schedule-windows.json
  housecall company booking-windows list [--show-for-days 7]
  housecall invoices list [--status open,paid] [--sort-by due_at]
  housecall invoices get <invoice_uuid>
  housecall invoices preview <invoice_uuid>

  housecall api GET /customers --query q=Jane --query page=1

Environment overrides:
  HOUSECALL_API_KEY
  HOUSECALL_ACCESS_TOKEN
  HOUSECALL_AUTH_MODE=token|bearer
  HOUSECALL_COMPANY_ID
  HOUSECALL_BASE_URL
  HOUSECALL_CLIENT_ID
  HOUSECALL_CLIENT_SECRET
  HOUSECALL_REDIRECT_URI
  HOUSECALL_REFRESH_TOKEN

Notes:
  API key auth uses:    Authorization: Token <api_key>
  OAuth auth uses:      Authorization: Bearer <access_token>
  OAuth authorize URL:  https://pro.housecallpro.com/oauth/authorize
  OAuth token URL:      https://api.housecallpro.com/oauth/token
`;
