import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
export async function requireRole(...allowed: Role[]) { const profile = await requireAdmin(); if (!allowed.includes(profile.role)) redirect("/admin/login?error=You%20do%20not%20have%20permission%20for%20this%20area"); return profile; }
export const adminRoles: Role[] = ["SUPER_ADMIN", "ADMIN"];
export const financeRoles: Role[] = adminRoles;
export const contentRoles: Role[] = adminRoles;
