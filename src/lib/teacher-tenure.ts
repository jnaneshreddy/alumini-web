export type TeacherTenureResult =
  | { ok: true; startYear: number; endYear: number | null }
  | { ok: false; message: string };

export function validateTeacherTenure(startYearText: string, endYearText: string, isCurrent: boolean, currentYear = new Date().getFullYear()): TeacherTenureResult {
  const startYear = Number.parseInt(startYearText, 10);
  const endYear = isCurrent ? null : Number.parseInt(endYearText, 10);
  const latestYear = currentYear + 1;
  if (!Number.isInteger(startYear) || startYear < 1900 || startYear > latestYear) return { ok: false, message: `Start year must be between 1900 and ${latestYear}.` };
  if (!isCurrent && !Number.isInteger(endYear)) return { ok: false, message: "End year is required for former teachers." };
  if (!isCurrent && endYear! < startYear) return { ok: false, message: "End year cannot be earlier than start year." };
  if (!isCurrent && endYear! > latestYear) return { ok: false, message: `End year cannot be later than ${latestYear}.` };
  return { ok: true, startYear, endYear };
}
