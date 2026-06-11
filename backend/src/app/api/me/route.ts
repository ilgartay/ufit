import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberFromRequest } from "@/lib/auth";
import { json, error, serializeMember } from "@/lib/api";

export async function GET(req: NextRequest) {
  const auth = getMemberFromRequest(req);
  if (!auth) return error("Yetkisiz", 401);

  const member = await prisma.member.findUnique({ where: { id: auth.sub } });
  if (!member) return error("Üye bulunamadı", 404);

  return json({ member: serializeMember(member) });
}
