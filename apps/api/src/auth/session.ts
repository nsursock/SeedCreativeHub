import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import argon2 from "argon2";
import { nanoid } from "nanoid";
import type { User } from "@prisma/client";
import type { Cache } from "../adapters/cache.js";
import { env } from "../env.js";

const SESSION_PREFIX = "sess:";

export type SessionUser = Pick<User, "id" | "email" | "role" | "status" | "locale" | "emailVerifiedAt">;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

export function createCsrfToken(): string {
  return nanoid(32);
}

export function timingSafeEqualString(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function createSession(cache: Cache, user: SessionUser): Promise<{ sessionId: string; csrfToken: string }> {
  const sessionId = generateToken(24);
  const csrfToken = createCsrfToken();
  const payload = JSON.stringify({ user, csrfToken });
  await cache.set(`${SESSION_PREFIX}${sessionId}`, payload, env.sessionTtlSeconds);
  return { sessionId, csrfToken };
}

export async function getSession(cache: Cache, sessionId: string | undefined): Promise<{ user: SessionUser; csrfToken: string } | null> {
  if (!sessionId) return null;
  const raw = await cache.get(`${SESSION_PREFIX}${sessionId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { user: SessionUser; csrfToken: string };
  } catch {
    return null;
  }
}

export async function destroySession(cache: Cache, sessionId: string | undefined) {
  if (!sessionId) return;
  await cache.del(`${SESSION_PREFIX}${sessionId}`);
}

export async function refreshSession(cache: Cache, sessionId: string, user: SessionUser, csrfToken: string) {
  await cache.set(
    `${SESSION_PREFIX}${sessionId}`,
    JSON.stringify({ user, csrfToken }),
    env.sessionTtlSeconds,
  );
}
