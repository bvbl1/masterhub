import type { User } from "@/lib/api";

export function userDisplayName(user: User): string {
  const name = `${user.firstName ?? ""} ${user.secondName ?? ""}`.trim();
  return name || user.email || `#${user.id}`;
}

export function userInitials(user: User): string {
  const a = user.firstName?.trim().charAt(0) ?? "";
  const b = user.secondName?.trim().charAt(0) ?? "";
  const s = `${a}${b}`.toUpperCase();
  if (s) return s;
  return user.email?.charAt(0)?.toUpperCase() ?? "?";
}
