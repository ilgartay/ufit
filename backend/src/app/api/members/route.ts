import { NextRequest } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getStaffFromRequest, hashPassword, generateTempPassword } from "@/lib/auth";
import { json, error, serializeMember } from "@/lib/api";
import { isValidTckn } from "@/lib/tckn";
import { sendSms, buildPasswordSms } from "@/lib/sms";

// GET /api/members?q=...&page=1
export async function GET(req: NextRequest) {
  const staff = getStaffFromRequest(req);
  if (!staff) return error("Yetkisiz", 401);

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const archived = searchParams.get("archived") === "1";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = 20;

  const where: Record<string, unknown> = {
    archivedAt: archived ? { not: null } : null,
  };
  if (q) {
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" as const } },
      { lastName: { contains: q, mode: "insensitive" as const } },
      { tckn: { contains: q } },
      { phone: { contains: q } },
    ];
  }

  const [total, members] = await Promise.all([
    prisma.member.count({ where }),
    prisma.member.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return json({
    total,
    page,
    pageSize,
    members: members.map((m) => serializeMember(m)),
  });
}

const createSchema = z.object({
  tckn: z.string().regex(/^\d{11}$/, "TCKN 11 haneli olmalı"),
  firstName: z.string().min(1, "Ad gerekli"),
  lastName: z.string().min(1, "Soyad gerekli"),
  phone: z.string().min(7, "Telefon gerekli"),
  email: z.string().email().optional().or(z.literal("")),
  membershipStart: z.string().optional(), // ISO tarih
  membershipEnd: z.string(), // ISO tarih
});

// POST /api/members
export async function POST(req: NextRequest) {
  const staff = getStaffFromRequest(req);
  if (!staff) return error("Yetkisiz", 401);

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return error(parsed.error.issues[0]?.message || "Geçersiz istek", 400);
  }
  const data = parsed.data;

  if (!isValidTckn(data.tckn)) {
    return error("Geçersiz TCKN (algoritma doğrulaması başarısız)", 400);
  }

  const existing = await prisma.member.findUnique({
    where: { tckn: data.tckn },
  });
  if (existing) return error("Bu TCKN ile kayıtlı üye zaten var", 409);

  const start = data.membershipStart ? new Date(data.membershipStart) : new Date();
  const end = new Date(data.membershipEnd);
  if (isNaN(end.getTime()) || end.getTime() <= start.getTime()) {
    return error("Üyelik bitiş tarihi başlangıçtan sonra olmalı", 400);
  }

  const tempPassword = generateTempPassword();
  const member = await prisma.member.create({
    data: {
      tckn: data.tckn,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      email: data.email || null,
      passwordHash: await hashPassword(tempPassword),
      qrSecret: crypto.randomBytes(24).toString("hex"),
      membershipStart: start,
      membershipEnd: end,
      mustChangePassword: true,
      createdById: staff.sub,
    },
  });

  // Geçici şifreyi SMS ile gönder (sağlayıcı ayarlıysa). Hata olsa da kayıt iptal edilmez.
  const sms = await sendSms(
    member.phone,
    buildPasswordSms(
      `${member.firstName} ${member.lastName}`,
      member.tckn,
      tempPassword
    )
  );

  // Geçici şifre yalnızca oluşturma yanıtında bir kez döner (personel yedeği).
  return json(
    {
      member: serializeMember(member, true),
      tempPassword,
      sms: { sent: sms.ok, provider: sms.provider, error: sms.error },
    },
    201
  );
}
