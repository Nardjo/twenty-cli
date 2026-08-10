---
name: twenty-cli
description: "Manage Twenty CRM via CLI - people, companies, opportunities, notes, tasks, targets. Use when user mentions Twenty CRM, contacts, deals, or CRM updates from the terminal."
category: productivity
---

# twenty-cli

Agent-ready CLI for the [Twenty](https://twenty.com) CRM REST API. Cloud and self-hosted.

## When To Use

- List/create/update **people**, **companies**, **opportunities**, **notes**, **tasks**
- Link notes/tasks to records via **note-targets** / **task-targets**
- Self-hosted Twenty (`TWENTY_BASE_URL`) or cloud
- CRM hygiene for agents (match by email before create; dated notes over field thrash)

## Setup

```bash
bun --version || curl -fsSL https://bun.sh/install | bash
npx api2cli install Nardjo/twenty-cli
# or bundle/link from ~/.cli/twenty-cli
npx api2cli bundle twenty && npx api2cli link twenty
```

```bash
twenty-cli auth set "$TWENTY_API_KEY"
export TWENTY_BASE_URL="https://your-twenty-host"   # self-host; omit for cloud
twenty-cli auth test
```

Always use `--json` when calling from an agent.

## Auth

| Command | Description |
|---------|-------------|
| `auth set <token>` | Save API key → `~/.config/tokens/twenty-cli.txt` (600) |
| `auth test` | `GET /people?limit=1` |
| `auth show` / `auth remove` | Masked show / delete |

API key: Twenty **Settings → API & Webhooks**.

## Resources

### people

| Command | Description |
|---------|-------------|
| `people list [--filter] [--order-by] [--limit] [--depth]` | List |
| `people get <id>` | Get one |
| `people create --json-body '<json>'` | Create (raw schema) |
| `people create-contact --first-name --last-name --email --phone --job-title --city --company-id` | Friendly create |
| `people find --email|--phone|--name` | Filter helper |
| `people update <id> --json-body '<json>'` | Patch |
| `people delete <id>` | Soft delete |

### companies

`list|get|create|update|delete` + `create-company --name --domain --employees`

### opportunities

`list|get|create|update|delete` + `create-opp --name --stage --company-id --point-of-contact-id --amount-euros --currency --close-date`

Stages: `NEW`, `SCREENING`, `MEETING`, `PROPOSAL`, `CUSTOMER`.

### notes

`list|get|create|update|delete` + **`notes add --title --markdown [--person-id] [--company-id] [--opportunity-id]`** (creates note + optional noteTarget).

### note-targets / task-targets / tasks / timeline-activities / workspace-members

Standard `list|get|create|update|delete` with `--json-body` on write.

### raw

Escape hatch: `raw get|post|patch|delete <path>` under `/rest`.

## Filter syntax

Twenty query `filter`: `field[COMPARATOR]:value`  
Examples: `emails.primaryEmail[eq]:a@b.com`, `name.firstName[ilike]:%ann%`, `stage[eq]:NEW`.

## Agent rules (Jordan / general)

1. Match existing person by **email > phone > name** before create.
2. Prefer **dated notes** (`notes add`) over overwriting fields.
3. Do not invent emails/phones — leave empty if unknown.
4. CRM content = summaries / next steps / facts — not raw chat dumps.
5. `--json-body` for complex payloads; never a flag named `--body`.

## Verification

```bash
twenty-cli --help
twenty-cli people --help
twenty-cli auth test
twenty-cli people list --limit 5 --json
```
