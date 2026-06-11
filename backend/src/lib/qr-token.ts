import crypto from "crypto";

/**
 * Girişte okutulacak kısa ömürlü, imzalı QR token üretimi/doğrulaması.
 *
 * Token formatı:  base64url(payload) + "." + base64url(hmac)
 *   payload = { m: memberId, e: expEpochSeconds }
 *   hmac    = HMAC-SHA256(payload, QR_SECRET + memberQrSecret)
 *
 * Doğrulama için üyenin qrSecret'ı gerekir; bu yüzden token tek başına
 * (üye DB kaydı olmadan) taklit edilemez ve süre dolduğunda geçersizdir.
 */

const QR_SECRET = process.env.QR_SECRET || "dev-qr-secret";
const TTL_SECONDS = parseInt(process.env.QR_TOKEN_TTL_SECONDS || "60", 10);

type QrPayload = { m: string; e: number };

function b64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(str: string): Buffer {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function sign(payloadB64: string, memberQrSecret: string): string {
  return b64url(
    crypto
      .createHmac("sha256", QR_SECRET + memberQrSecret)
      .update(payloadB64)
      .digest()
  );
}

/** Üye için yeni bir giriş token'ı üretir. */
export function issueEntryToken(
  memberId: string,
  memberQrSecret: string,
  ttlSeconds: number = TTL_SECONDS
): { token: string; expiresAt: number; ttl: number } {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload: QrPayload = { m: memberId, e: exp };
  const payloadB64 = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = sign(payloadB64, memberQrSecret);
  return {
    token: `${payloadB64}.${sig}`,
    expiresAt: exp,
    ttl: ttlSeconds,
  };
}

/** Token'dan memberId'yi imza doğrulamadan okur (DB'den qrSecret bulmak için). */
export function peekMemberId(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  try {
    const payload = JSON.parse(b64urlDecode(parts[0]).toString()) as QrPayload;
    return typeof payload.m === "string" ? payload.m : null;
  } catch {
    return null;
  }
}

export type VerifyResult =
  | { ok: true; memberId: string }
  | { ok: false; reason: "format" | "signature" | "expired" };

/** Token imzasını ve süresini üyenin qrSecret'ı ile doğrular. */
export function verifyEntryToken(
  token: string,
  memberQrSecret: string
): VerifyResult {
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, reason: "format" };
  const [payloadB64, sig] = parts;

  let payload: QrPayload;
  try {
    payload = JSON.parse(b64urlDecode(payloadB64).toString()) as QrPayload;
  } catch {
    return { ok: false, reason: "format" };
  }
  if (typeof payload.m !== "string" || typeof payload.e !== "number") {
    return { ok: false, reason: "format" };
  }

  const expected = sign(payloadB64, memberQrSecret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: "signature" };
  }

  if (Math.floor(Date.now() / 1000) > payload.e) {
    return { ok: false, reason: "expired" };
  }

  return { ok: true, memberId: payload.m };
}
