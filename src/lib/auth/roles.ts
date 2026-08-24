export const USER_ROLES = ["user", "admin", "super_admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function normalizeUserRole(role: string | null | undefined): UserRole {
  return USER_ROLES.includes(role as UserRole) ? role as UserRole : "user";
}

export function isAdminRole(role: string | null | undefined): role is "admin" | "super_admin" {
  return role === "admin" || role === "super_admin";
}

export function isSuperAdminRole(role: string | null | undefined): role is "super_admin" {
  return role === "super_admin";
}

export const ROLE_LABELS: Record<UserRole, string> = {
  user: "普通用户",
  admin: "管理员",
  super_admin: "超级管理员",
};
