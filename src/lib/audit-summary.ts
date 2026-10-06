type AuditRecord = Record<string, unknown>;

const HIDDEN_FIELDS = new Set(["summary", "password", "passwordHash", "currentPassword", "newPassword", "confirmPassword", "updatedAt"]);

const FIELD_LABELS: Record<string, string> = {
  active: "account status",
  coverImageUrl: "cover image",
  endDate: "end date",
  imageUrl: "image",
  isActive: "account status",
  isPublished: "public visibility",
  logoUrl: "logo",
  published: "public visibility",
  publishedAt: "publish status",
  role: "role",
  startDate: "start date",
  status: "status",
  titleEn: "English title",
  titleKn: "Kannada title",
};

function asRecord(value: unknown): AuditRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as AuditRecord) : {};
}

function humanize(value: string) {
  return FIELD_LABELS[value] ?? value.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replaceAll("_", " ").toLowerCase();
}

function joinList(items: string[]) {
  if (items.length <= 1) return items[0] ?? "details";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

function entityName(entityType: string, oldData: AuditRecord, newData: AuditRecord) {
  const value = newData.title ?? newData.titleEn ?? newData.nameEn ?? newData.fullName ?? newData.name ?? newData.targetEmail ?? newData.email ?? newData.subject ?? newData.year ?? oldData.title ?? oldData.titleEn ?? oldData.nameEn ?? oldData.fullName ?? oldData.name ?? oldData.targetEmail ?? oldData.email ?? oldData.subject ?? oldData.year;
  const type = humanize(entityType);
  return typeof value === "string" || typeof value === "number" ? `${type} “${String(value)}”` : `this ${type}`;
}

export function getAuditSummary(input: { action: string; entityType: string; oldData?: unknown; newData?: unknown }) {
  const oldData = asRecord(input.oldData);
  const newData = asRecord(input.newData);
  const savedSummary = newData.summary ?? oldData.summary;
  if (typeof savedSummary === "string" && savedSummary.trim()) return savedSummary.trim();

  const action = input.action.toLowerCase();
  const target = entityName(input.entityType, oldData, newData);
  const keys = Array.from(new Set([...Object.keys(oldData), ...Object.keys(newData)]));
  const changedFields = keys
    .filter((key) => !HIDDEN_FIELDS.has(key))
    .filter((key) => JSON.stringify(oldData[key]) !== JSON.stringify(newData[key]))
    .map(humanize);

  if (action.includes("password")) return `Changed the password for ${target}.`;
  if (action.includes("delete") || action.includes("remove")) return `Deleted ${target}.`;
  if (action.includes("create") || action.includes("add")) return `Created ${target}.`;
  if (action.includes("publish")) return `Changed the public visibility of ${target}.`;
  if (action.includes("approve")) return `Approved ${target}.`;
  if (action.includes("reject")) return `Rejected ${target}.`;
  if (action.includes("update") || action.includes("edit") || changedFields.length) {
    const visibleFields = changedFields.slice(0, 5);
    const remainder = changedFields.length - visibleFields.length;
    if (remainder > 0) visibleFields.push(`${remainder} other ${remainder === 1 ? "field" : "fields"}`);
    return `Updated ${target}: ${joinList(visibleFields)}.`;
  }
  return `${humanize(input.action)} on ${target}.`;
}
