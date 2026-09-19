import type { UserRole } from "@prisma/client";
import type { SessionUser } from "./session.js";

export function requireUser(user: SessionUser | null | undefined): SessionUser {
  if (!user) throw Object.assign(new Error("Unauthorized"), { extensions: { code: "UNAUTHORIZED" } });
  if (user.status === "suspended") {
    throw Object.assign(new Error("Account suspended"), { extensions: { code: "FORBIDDEN" } });
  }
  return user;
}

export function requireRole(user: SessionUser | null | undefined, roles: UserRole[]): SessionUser {
  const u = requireUser(user);
  if (!roles.includes(u.role)) {
    throw Object.assign(new Error("Forbidden"), { extensions: { code: "FORBIDDEN" } });
  }
  return u;
}

export function requireVerified(user: SessionUser): SessionUser {
  if (!user.emailVerifiedAt) {
    throw Object.assign(new Error("Email verification required"), { extensions: { code: "UNVERIFIED" } });
  }
  return user;
}

export function isStaff(user: SessionUser | null | undefined): boolean {
  return !!user && (user.role === "admin" || user.role === "editor");
}
