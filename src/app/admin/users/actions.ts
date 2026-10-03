"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { notifyAdmins } from "@/lib/admin-notifications";
import { prisma } from "@/lib/prisma";
import { adminRoles, requireRole } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

export type UserActionResult = { ok: boolean; message: string };
const roles: Role[] = ["USER", "ADMIN", "SUPER_ADMIN"];
const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

function refreshUsers() { revalidatePath("/admin/users"); revalidatePath("/admin"); revalidatePath("/admin/activity"); }

export async function changeUserRole(formData: FormData): Promise<UserActionResult> {
  const actor = await requireRole(...adminRoles);
  const targetId = text(formData, "userId");
  const requested = text(formData, "role") as Role;
  if (!roles.includes(requested)) return { ok: false, message: "Choose a valid role." };
  const target = await prisma.userProfile.findUnique({ where: { id: targetId } });
  if (!target) return { ok: false, message: "User not found." };
  if (target.id === actor.id) return { ok: false, message: "You cannot change your own role." };
  if (actor.role === "ADMIN" && (target.role === "SUPER_ADMIN" || requested === "SUPER_ADMIN")) return { ok: false, message: "You do not have permission to perform this action." };
  if (target.role === "SUPER_ADMIN" && requested !== "SUPER_ADMIN") {
    const superAdmins = await prisma.userProfile.count({ where: { role: "SUPER_ADMIN", active: true } });
    if (superAdmins <= 1) return { ok: false, message: "The final active Super Admin cannot be demoted." };
  }
  if (target.role === requested) return { ok: true, message: "The user already has this role." };
  await prisma.$transaction([
    prisma.userProfile.update({ where: { id: target.id }, data: { role: requested } }),
    prisma.auditLog.create({ data: { userId: actor.id, action: "USER_ROLE_CHANGED", entityType: "UserProfile", entityId: target.id, oldData: { role: target.role }, newData: { role: requested } } }),
  ]);
  refreshUsers();
  await notifyAdmins({ title: "User role changed", message: `${actor.fullName} changed ${target.fullName}'s role to ${requested.replaceAll("_", " ").toLowerCase()}.`, topic: "ACCESS", href: "/admin/users", excludeUserId: actor.id });
  return { ok: true, message: `${target.fullName}'s role was changed to ${requested.replaceAll("_", " ").toLowerCase()}.` };
}

export async function setUserActive(formData: FormData): Promise<UserActionResult> {
  const actor = await requireRole(...adminRoles);
  const targetId = text(formData, "userId");
  const active = text(formData, "active") === "true";
  const target = await prisma.userProfile.findUnique({ where: { id: targetId } });
  if (!target) return { ok: false, message: "User not found." };
  if (target.id === actor.id) return { ok: false, message: "You cannot deactivate your own account." };
  if (actor.role === "ADMIN" && target.role === "SUPER_ADMIN") return { ok: false, message: "You do not have permission to perform this action." };
  if (!active && target.role === "SUPER_ADMIN") {
    const superAdmins = await prisma.userProfile.count({ where: { role: "SUPER_ADMIN", active: true } });
    if (superAdmins <= 1) return { ok: false, message: "The final active Super Admin cannot be deactivated." };
  }
  await prisma.$transaction([
    prisma.userProfile.update({ where: { id: target.id }, data: { active } }),
    prisma.auditLog.create({ data: { userId: actor.id, action: active ? "USER_REACTIVATED" : "USER_DEACTIVATED", entityType: "UserProfile", entityId: target.id, oldData: { active: target.active }, newData: { active } } }),
  ]);
  try { await createAdminClient().auth.admin.updateUserById(target.authUserId, { ban_duration: active ? "none" : "876000h" }); } catch (error) { console.error("Unable to synchronize Supabase Auth status", error); }
  refreshUsers();
  await notifyAdmins({ title: active ? "User reactivated" : "User deactivated", message: `${actor.fullName} ${active ? "reactivated" : "deactivated"} ${target.fullName}.`, topic: "ACCESS", href: "/admin/users", excludeUserId: actor.id });
  return { ok: true, message: `${target.fullName} is now ${active ? "active" : "deactivated"}.` };
}

export async function createManagedUser(formData: FormData): Promise<UserActionResult> {
  const actor = await requireRole("SUPER_ADMIN");
  const fullName = text(formData, "fullName");
  const email = text(formData, "email").toLowerCase();
  const password = text(formData, "password");
  const requested = text(formData, "role") as Role;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (fullName.length < 2 || !emailPattern.test(email) || !roles.includes(requested)) return { ok: false, message: "Enter a valid name, email address and role." };
  if (password && password.length < 8) return { ok: false, message: "Temporary passwords must contain at least 8 characters." };
  if (await prisma.userProfile.findUnique({ where: { email } })) return { ok: false, message: "An account already exists for this email address." };
  const supabase = createAdminClient();
  const authResult = password
    ? await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: fullName } })
    : await supabase.auth.admin.inviteUserByEmail(email, { data: { full_name: fullName } });
  if (authResult.error || !authResult.data.user) return { ok: false, message: authResult.error?.message || "Unable to create this user." };
  try {
    const profile = await prisma.userProfile.create({ data: { authUserId: authResult.data.user.id, email, fullName, role: requested, phone: text(formData, "phone") || null, batch: text(formData, "batch") || null } });
    await prisma.auditLog.create({ data: { userId: actor.id, action: "USER_CREATED", entityType: "UserProfile", entityId: profile.id, newData: { email, role: requested, invitation: !password } } });
    refreshUsers();
    await notifyAdmins({ title: "User account created", message: `${actor.fullName} created an account for ${fullName}.`, topic: "ACCESS", href: "/admin/users", excludeUserId: actor.id });
    return { ok: true, message: password ? "User created successfully." : "Invitation sent and user profile created." };
  } catch (error) {
    await supabase.auth.admin.deleteUser(authResult.data.user.id);
    return { ok: false, message: error instanceof Error ? error.message : "Unable to create this user." };
  }
}
