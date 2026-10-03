import type { Role } from "@prisma/client";

export function canChangeManagedUserRole(actor: Role, target: Role, requested: Role) {
  if (actor === "SUPER_ADMIN") return true;
  return actor === "ADMIN" && target !== "SUPER_ADMIN" && requested !== "SUPER_ADMIN";
}

export function canChangeManagedUserStatus(actor: Role, target: Role) {
  if (actor === "SUPER_ADMIN") return true;
  return actor === "ADMIN" && target !== "SUPER_ADMIN";
}

export function canCreateManagedUser(actor: Role) {
  return actor === "SUPER_ADMIN";
}

export function canDeleteManagedUser(actor: Role, target: Role) {
  if (actor === "SUPER_ADMIN") return true;
  return actor === "ADMIN" && target !== "SUPER_ADMIN";
}
