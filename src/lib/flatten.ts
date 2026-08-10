/** Flatten nested Twenty records for table/text output. */

function pickEmail(row: Record<string, unknown>): string {
  const emails = row.emails as Record<string, unknown> | undefined;
  if (emails?.primaryEmail) return String(emails.primaryEmail);
  return "";
}

function pickPhone(row: Record<string, unknown>): string {
  const phones = row.phones as Record<string, unknown> | undefined;
  if (!phones) return "";
  const code = phones.primaryPhoneCallingCode ? String(phones.primaryPhoneCallingCode) : "";
  const num = phones.primaryPhoneNumber ? String(phones.primaryPhoneNumber) : "";
  return `${code}${num}`.trim();
}

function pickName(row: Record<string, unknown>): string {
  const name = row.name;
  if (typeof name === "string") return name;
  if (name && typeof name === "object") {
    const n = name as Record<string, unknown>;
    return [n.firstName, n.lastName].filter(Boolean).join(" ").trim();
  }
  if (row.title) return String(row.title);
  return "";
}

function pickDomain(row: Record<string, unknown>): string {
  const d = row.domainName as Record<string, unknown> | undefined;
  if (d?.primaryLinkUrl) return String(d.primaryLinkUrl);
  return "";
}

function pickAmount(row: Record<string, unknown>): string {
  const a = row.amount as Record<string, unknown> | undefined;
  if (!a || a.amountMicros == null) return "";
  const micros = Number(a.amountMicros);
  if (Number.isNaN(micros)) return "";
  const code = a.currencyCode ? String(a.currencyCode) : "";
  return `${(micros / 1_000_000).toFixed(2)}${code ? " " + code : ""}`;
}

function pickMarkdown(row: Record<string, unknown>): string {
  const body = row.bodyV2 as Record<string, unknown> | undefined;
  if (body?.markdown) {
    const md = String(body.markdown).replace(/\s+/g, " ").trim();
    return md.length > 80 ? md.slice(0, 77) + "…" : md;
  }
  return "";
}

/** Map a list of Twenty objects to flat rows for text/csv tables. */
export function flattenRecords(plural: string, rows: unknown[]): Record<string, unknown>[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => flattenOne(plural, r as Record<string, unknown>));
}

export function flattenOne(plural: string, row: Record<string, unknown>): Record<string, unknown> {
  const base: Record<string, unknown> = {
    id: row.id ?? "",
  };

  switch (plural) {
    case "people":
      return {
        ...base,
        name: pickName(row),
        email: pickEmail(row),
        phone: pickPhone(row),
        jobTitle: row.jobTitle ?? "",
        city: row.city ?? "",
        companyId: row.companyId ?? "",
        updatedAt: row.updatedAt ?? "",
      };
    case "companies":
      return {
        ...base,
        name: pickName(row),
        domain: pickDomain(row),
        employees: row.employees ?? "",
        idealCustomerProfile: row.idealCustomerProfile ?? "",
        updatedAt: row.updatedAt ?? "",
      };
    case "opportunities":
      return {
        ...base,
        name: pickName(row),
        stage: row.stage ?? "",
        amount: pickAmount(row),
        closeDate: row.closeDate ?? "",
        companyId: row.companyId ?? "",
        pointOfContactId: row.pointOfContactId ?? "",
        updatedAt: row.updatedAt ?? "",
      };
    case "notes":
      return {
        ...base,
        title: row.title ?? "",
        body: pickMarkdown(row),
        updatedAt: row.updatedAt ?? "",
      };
    case "tasks":
      return {
        ...base,
        title: row.title ?? "",
        status: row.status ?? "",
        dueAt: row.dueAt ?? "",
        updatedAt: row.updatedAt ?? "",
      };
    case "noteTargets":
      return {
        ...base,
        noteId: row.noteId ?? "",
        personId: row.personId ?? "",
        companyId: row.companyId ?? "",
        opportunityId: row.opportunityId ?? "",
      };
    case "taskTargets":
      return {
        ...base,
        taskId: row.taskId ?? "",
        personId: row.personId ?? "",
        companyId: row.companyId ?? "",
        opportunityId: row.opportunityId ?? "",
      };
    case "workspaceMembers":
      return {
        ...base,
        name: pickName(row),
        userEmail: row.userEmail ?? row.email ?? "",
        updatedAt: row.updatedAt ?? "",
      };
    case "timelineActivities":
      return {
        ...base,
        name: row.name ?? "",
        type: row.type ?? "",
        happensAt: row.happensAt ?? row.createdAt ?? "",
        personId: row.personId ?? "",
        companyId: row.companyId ?? "",
      };
    default:
      return { ...base, ...row };
  }
}

/** Extract the array of records from a Twenty list response. */
export function extractList(plural: string, res: unknown): unknown[] {
  if (!res || typeof res !== "object") return [];
  const data = (res as Record<string, unknown>).data;
  if (data && typeof data === "object" && plural in (data as object)) {
    const arr = (data as Record<string, unknown>)[plural];
    return Array.isArray(arr) ? arr : [];
  }
  if (Array.isArray(data)) return data;
  if (Array.isArray(res)) return res as unknown[];
  return [];
}

/**
 * Extract a single record from get/create/update response.
 * Twenty shapes seen in the wild:
 *   { data: { person: {...} } }
 *   { data: { createNote: {...} } }          // REST create
 *   { data: { updatePerson: {...} } }
 *   { data: { createNote: {...} } } nested under an extra data when proxied
 */
export function extractOne(singular: string, res: unknown): unknown {
  if (!res || typeof res !== "object") return res;

  let node: unknown = res;
  // Unwrap nested `{ data: ... }` shells (max 3)
  for (let i = 0; i < 3; i++) {
    if (!node || typeof node !== "object" || Array.isArray(node)) break;
    const obj = node as Record<string, unknown>;
    if ("data" in obj && obj.data && typeof obj.data === "object") {
      node = obj.data;
      continue;
    }
    break;
  }

  if (!node || typeof node !== "object" || Array.isArray(node)) return node ?? res;
  const obj = node as Record<string, unknown>;

  if (singular in obj) return obj[singular];

  const pascal = singular.charAt(0).toUpperCase() + singular.slice(1);
  for (const prefix of ["create", "update", "upsert", "delete"]) {
    const key = `${prefix}${pascal}`;
    if (key in obj) return obj[key];
  }

  // Single-key object → that value
  const keys = Object.keys(obj).filter((k) => k !== "pageInfo" && k !== "totalCount");
  if (keys.length === 1) return obj[keys[0]!];

  // Already a record
  if ("id" in obj) return obj;

  return obj;
}
