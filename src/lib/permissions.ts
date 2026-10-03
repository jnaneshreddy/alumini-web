import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
export async function requireRole(...allowed: Role[]) { const profile = await requireAdmin(); if (!allowed.includes(profile.role)) redirect("/admin/login?error=You%20do%20not%20have%20permission%20for%20this%20area"); return profile; }
export const financeRoles: Role[] = ["SUPER_ADMIN", "TREASURER"];
export const contentRoles: Role[] = ["SUPER_ADMIN", "SECRETARY", "EDITOR"];
