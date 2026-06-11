import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signMemberToken } from "@/lib/auth";
import { json, error, serializeMember } from "@/lib/api";

const schema = z.object({
  tckn: z.string().regex(/^\d{11}$/, "TCKN 11 haneli olmalı"),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return error("TCKN ve şifre gerekli", 400);

  const member = await prisma.member.findUnique({
    where: { tckn: parsed.data.tckn },
  });
  if (!member || !(await verifyPassword(parsed.data.password, member.passwordHash))) {
    return error("TCKN veya şifre hatalı", 401);
  }

  const token = signMemberToken({ sub: member.id, tckn: member.tckn });

  return json({
    token,
    mustChangePassword: member.mustChangePassword,
    member: serializeMember(member),
  });
}
