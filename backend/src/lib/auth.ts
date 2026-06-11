import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret";

export type StaffTokenPayload = {
  sub: string; // staff id
  username: string;
  role: "ADMIN" | "STAFF";
  typ: "staff";
};

export type MemberTokenPayload = {
  sub: string; // member id
  tckn: string;
  typ: "member";
};

export type AnyTokenPayload = StaffTokenPayload | MemberTokenPayload;

// ---- Şifre yardımcıları ----
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Personele iletilmek üzere okunabilir geçici şifre üretir. */
export function generateTempPassword(length = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnpqrstuvwxyz";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

// ---- JWT yardımcıları ----
export function signStaffToken(payload: Omit<StaffTokenPayload, "typ">): string {
  return jwt.sign({ ...payload, typ: "staff" }, JWT_SECRET, {
    expiresIn: "12h",
  });
}

export function signMemberToken(
  payload: Omit<MemberTokenPayload, "typ">
): string {
  return jwt.sign({ ...payload, typ: "member" }, JWT_SECRET, {
    expiresIn: "30d",
  });
}

function bearerToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) return null;
  return auth.slice(7).trim() || null;
}

/** Personel JWT'sini doğrular. Geçersizse null döner. */
export function getStaffFromRequest(
  req: NextRequest
): StaffTokenPayload | null {
  const token = bearerToken(req);
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AnyTokenPayload;
    if (decoded.typ !== "staff") return null;
    return decoded;
  } catch {
    return null;
  }
}

/** Üye JWT'sini doğrular. Geçersizse null döner. */
export function getMemberFromRequest(
  req: NextRequest
): MemberTokenPayload | null {
  const token = bearerToken(req);
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AnyTokenPayload;
    if (decoded.typ !== "member") return null;
    return decoded;
  } catch {
    return null;
  }
}
