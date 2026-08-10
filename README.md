# twenty-cli

Agent-ready CLI for the [Twenty](https://twenty.com) CRM **REST API**. Works with **Twenty Cloud** and any **self-hosted** instance.

Built with [api2cli](https://api2cli.dev).

```bash
twenty-cli people list --json
twenty-cli people find --email sonny@example.com --json
twenty-cli notes add --title "Call" --markdown "- next step" --person-id <uuid> --json
```

## Install

```bash
npx api2cli install Nardjo/twenty-cli
# or
npx api2cli install twenty-cli
```

From source:

```bash
bun --version || curl -fsSL https://bun.sh/install | bash
git clone https://github.com/Nardjo/twenty-cli.git
cd twenty-cli
npx api2cli bundle twenty
npx api2cli link twenty
```

## Authentication

Create an API key in Twenty: **Settings → API & Webhooks → + Create key**.

```bash
twenty-cli auth set "YOUR_API_KEY"   # ~/.config/tokens/twenty-cli.txt (chmod 600)
twenty-cli auth test                 # GET /people?limit=1
```

### Self-hosted / custom domain

Default base is Twenty Cloud (`https://api.twenty.com/rest`). Point at your instance with `TWENTY_BASE_URL` (root URL **or** `…/rest`):

```bash
export TWENTY_BASE_URL="https://crm.example.com"
twenty-cli people list --json
```

## Resources

| Resource | Actions |
|----------|---------|
| `people` | `list`, `get`, `create`, `update`, `delete`, `create-contact`, `find` |
| `companies` | `list`, `get`, `create`, `update`, `delete`, `create-company` |
| `opportunities` | `list`, `get`, `create`, `update`, `delete`, `create-opp` |
| `notes` | `list`, `get`, `create`, `update`, `delete`, `add` (markdown + optional link) |
| `note-targets` | `list`, `get`, `create`, `update`, `delete` |
| `tasks` | `list`, `get`, `create`, `update`, `delete` |
| `task-targets` | `list`, `get`, `create`, `update`, `delete` |
| `timeline-activities` | `list`, `get`, `create`, `update`, `delete` |
| `workspace-members` | `list`, `get`, `create`, `update`, `delete` |
| `raw` | `get`, `post`, `patch`, `delete` (escape hatch) |
| `auth` | `set`, `show`, `test`, `remove` |

List query flags (most resources): `--filter`, `--order-by`, `--limit`, `--depth`, `--starting-after`, `--ending-before`.

Filter syntax (Twenty): `field[COMPARATOR]:value` e.g. `emails.primaryEmail[eq]:a@b.com`, `name.firstName[ilike]:%ann%`.

Create/update raw schema via `--json-body` (never use a flag named `--body`).

## Examples

```bash
# Contacts
twenty-cli people list --limit 50 --json
twenty-cli people find --email a@b.com --json
twenty-cli people create-contact \
  --first-name Ada --last-name Lovelace \
  --email ada@example.com --phone +33600000000 \
  --job-title "Engineer" --json

# Companies & deals
twenty-cli companies create-company --name Acme --domain https://acme.com --json
twenty-cli opportunities create-opp --name "Acme — atelier" --stage NEW --company-id <uuid> --json

# Notes linked to a person
twenty-cli notes add \
  --title "2026-08-10 call" \
  --markdown "- decided X\n- next: Y" \
  --person-id <uuid> --json

# Any other REST path
twenty-cli raw get attachments --query '{"limit":"5"}' --json
```

## Agent notes

- Always pass `--json` for machine parsing (`{ "ok": true, "data": ... }`).
- Prefer `people find` / email match before creating duplicates.
- Prefer `notes add` over dumping full chat transcripts into CRM fields.
- OpenAPI for a workspace is available on the instance at `/open-api/core` (authenticated).

## License

MIT
