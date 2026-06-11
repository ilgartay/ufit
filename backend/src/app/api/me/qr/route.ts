import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberFromRequest } from "@/lib/auth";
import { json, error, membershipState } from "@/lib/api";
import { issueEntryToken } from "@/lib/qr-token";

export async function GET(req: NextRequest) {
  const auth = getMemberFromRequest(req);
  if (!auth) return error("Yetkisiz", 401);

  const member = await prisma.member.findUnique({ where: { id: auth.sub } });
  if (!member) return error("Üye bulunamadı", 404);

  const state = membershipState(member);
  const { token, expiresAt, ttl } = issueEntryToken(member.id, member.qrSecret);

  // Token her zaman üretilir; üyelik geçersizse uygulama yine de uyarı gösterebilir.
  return json({
    token,
    expiresAt,
    ttl,
    membershipActive: state.active,
    daysLeft: state.daysLeft,
  });
}
