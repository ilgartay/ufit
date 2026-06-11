import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStaffFromRequest, hashPassword, generateTempPassword } from "@/lib/auth";
import { json, error, serializeMember } from "@/lib/api";
import { sendSms, buildPasswordSms } from "@/lib/sms";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/members/[id]  -> detay (tam TCKN) + son girişler
export async function GET(req: NextRequest, { params }: Ctx) {
  const staff = getStaffFromRequest(req);
  if (!staff) return error("Yetkisiz", 401);
  const { id } = await params;

  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      entries: { orderBy: { timestamp: "desc" }, take: 50 },
      createdBy: { select: { username: true, fullName: true } },
    },
  });
  if (!member) return error("Üye bulunamadı", 404);

  return json({
    member: serializeMember(member, true),
    createdBy: member.createdBy,
    entries: member.entries.map((e) => ({
      id: e.id,
      timestamp: e.timestamp.toISOString(),
      direction: e.direction,
      result: e.result,
      reason: e.reason,
      gate: e.gate,
    })),
  });
}

const patchSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().min(7).optional(),
  email: z.string().email().optional().or(z.literal("")),
  membershipStart: z.string().optional(),
  membershipEnd: z.string().optional(),
  status: z.enum(["ACTIVE", "PASSIVE", "SUSPENDED"]).optional(),
  resetPassword: z.boolean().optional(),
  archived: z.boolean().optional(),
});

// PATCH /api/members/[id]  -> üyelik güncelle / şifre sıfırla
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const staff = getStaffFromRequest(req);
  if (!staff) return error("Yetkisiz", 401);
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return error(parsed.error.issues[0]?.message || "Geçersiz istek", 400);
  }
  const d = parsed.data;

  const member = await prisma.member.findUnique({ where: { id } });
  if (!member) return error("Üye bulunamadı", 404);

  const updateData: Record<string, unknown> = {};
  if (d.firstName !== undefined) updateData.firstName = d.firstName;
  if (d.lastName !== undefined) updateData.lastName = d.lastName;
  if (d.phone !== undefined) updateData.phone = d.phone;
  if (d.email !== undefined) updateData.email = d.email || null;
  if (d.status !== undefined) updateData.status = d.status;
  if (d.membershipStart !== undefined)
    updateData.membershipStart = new Date(d.membershipStart);
  if (d.membershipEnd !== undefined)
    updateData.membershipEnd = new Date(d.membershipEnd);
  if (d.archived !== undefined)
    updateData.archivedAt = d.archived ? new Date() : null;

  let tempPassword: string | undefined;
  if (d.resetPassword) {
    tempPassword = generateTempPassword();
    updateData.passwordHash = await hashPassword(tempPassword);
    updateData.mustChangePassword = true;
  }

  const start = (updateData.membershipStart as Date) ?? member.membershipStart;
  const end = (updateData.membershipEnd as Date) ?? member.membershipEnd;
  if (isNaN(end.getTime()) || end.getTime() <= start.getTime()) {
    return error("Üyelik bitiş tarihi başlangıçtan sonra olmalı", 400);
  }

  const updated = await prisma.member.update({
    where: { id },
    data: updateData,
  });

  // Şifre sıfırlandıysa yeni geçici şifreyi SMS ile gönder.
  let sms;
  if (tempPassword) {
    const r = await sendSms(
      updated.phone,
      buildPasswordSms(
        `${updated.firstName} ${updated.lastName}`,
        updated.tckn,
        tempPassword
      )
    );
    sms = { sent: r.ok, provider: r.provider, error: r.error };
  }

  return json({
    member: serializeMember(updated, true),
    ...(tempPassword ? { tempPassword } : {}),
    ...(sms ? { sms } : {}),
  });
}

// DELETE /api/members/[id]  -> üyeyi ve giriş kayıtlarını kalıcı sil (yalnız ADMIN)
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const staff = getStaffFromRequest(req);
  if (!staff) return error("Yetkisiz", 401);
  if (staff.role !== "ADMIN") {
    return error("Bu işlem için yönetici yetkisi gerekir", 403);
  }
  const { id } = await params;

  const member = await prisma.member.findUnique({ where: { id } });
  if (!member) return error("Üye bulunamadı", 404);

  // EntryLog kayıtları onDelete: Cascade ile birlikte silinir.
  await prisma.member.delete({ where: { id } });

  return json({ ok: true, deletedId: id });
}
