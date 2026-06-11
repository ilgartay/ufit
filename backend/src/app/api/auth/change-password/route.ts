import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  getMemberFromRequest,
  verifyPassword,
  hashPassword,
} from "@/lib/auth";
import { json, error } from "@/lib/api";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, "Yeni şifre en az 6 karakter olmalı"),
});

export async function POST(req: NextRequest) {
  const auth = getMemberFromRequest(req);
  if (!auth) return error("Yetkisiz", 401);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return error(parsed.error?.issues[0]?.message || "Geçersiz istek", 400);
  }

  const member = await prisma.member.findUnique({ where: { id: auth.sub } });
  if (!member) return error("Üye bulunamadı", 404);

  if (!(await verifyPassword(parsed.data.currentPassword, member.passwordHash))) {
    return error("Mevcut şifre hatalı", 401);
  }

  await prisma.member.update({
    where: { id: member.id },
    data: {
      passwordHash: await hashPassword(parsed.data.newPassword),
      mustChangePassword: false,
    },
  });

  return json({ ok: true });
}
