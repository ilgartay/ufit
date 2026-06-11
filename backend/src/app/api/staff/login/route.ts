import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signStaffToken } from "@/lib/auth";
import { json, error } from "@/lib/api";

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return error("Kullanıcı adı ve şifre gerekli", 400);

  const staff = await prisma.staff.findUnique({
    where: { username: parsed.data.username },
  });
  if (!staff || !(await verifyPassword(parsed.data.password, staff.passwordHash))) {
    return error("Kullanıcı adı veya şifre hatalı", 401);
  }

  const token = signStaffToken({
    sub: staff.id,
    username: staff.username,
    role: staff.role,
  });

  return json({
    token,
    staff: {
      id: staff.id,
      username: staff.username,
      fullName: staff.fullName,
      role: staff.role,
    },
  });
}
