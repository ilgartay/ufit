import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStaffFromRequest } from "@/lib/auth";
import { json, error, membershipState } from "@/lib/api";
import { peekMemberId, verifyEntryToken } from "@/lib/qr-token";

const schema = z.object({
  token: z.string().min(1),
  gate: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const staff = getStaffFromRequest(req);
  if (!staff) return error("Yetkisiz", 401);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return error("Token gerekli", 400);
  const { token, gate } = parsed.data;

  // Red sebepleri dil-bağımsız KODLAR olarak döner; UI çevirir.
  const memberId = peekMemberId(token);
  if (!memberId) {
    return json({ result: "DENIED", reason: "QR_BAD_FORMAT" }, 200);
  }

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) {
    return json({ result: "DENIED", reason: "MEMBER_NOT_FOUND" }, 200);
  }

  // İmza + süre doğrulaması
  const verify = verifyEntryToken(token, member.qrSecret);
  if (!verify.ok) {
    const reasonMap = {
      format: "QR_BAD_FORMAT",
      signature: "QR_BAD_SIGNATURE",
      expired: "QR_EXPIRED",
    } as const;
    return json(
      {
        result: "DENIED",
        reason: reasonMap[verify.reason],
        member: { id: member.id, fullName: `${member.firstName} ${member.lastName}` },
      },
      200
    );
  }

  // Üyelik geçerlilik kontrolü
  const state = membershipState(member);
  let result: "GRANTED" | "DENIED" = "GRANTED";
  let reason: string | null = null;
  if (!state.active) {
    result = "DENIED";
    if (state.archived) reason = "MEMBERSHIP_ARCHIVED";
    else if (state.status === "SUSPENDED") reason = "MEMBERSHIP_SUSPENDED";
    else if (state.status === "PASSIVE") reason = "MEMBERSHIP_PASSIVE";
    else if (state.expired) reason = "MEMBERSHIP_EXPIRED";
    else reason = "MEMBERSHIP_INVALID";
  }

  // Yön: son log IN ise OUT, değilse IN (basit turnike mantığı)
  const lastEntry = await prisma.entryLog.findFirst({
    where: { memberId: member.id, result: "GRANTED" },
    orderBy: { timestamp: "desc" },
  });
  const direction = lastEntry?.direction === "IN" ? "OUT" : "IN";

  await prisma.entryLog.create({
    data: {
      memberId: member.id,
      direction,
      result,
      reason,
      gate: gate || null,
    },
  });

  return json(
    {
      result,
      direction,
      reason,
      member: {
        id: member.id,
        fullName: `${member.firstName} ${member.lastName}`,
        daysLeft: state.daysLeft,
        membershipEnd: state.membershipEnd,
      },
    },
    200
  );
}
