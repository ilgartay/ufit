import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberFromRequest } from "@/lib/auth";
import { json, error } from "@/lib/api";

export async function GET(req: NextRequest) {
  const auth = getMemberFromRequest(req);
  if (!auth) return error("Yetkisiz", 401);

  const entries = await prisma.entryLog.findMany({
    where: { memberId: auth.sub },
    orderBy: { timestamp: "desc" },
    take: 100,
  });

  return json({
    entries: entries.map((e) => ({
      id: e.id,
      timestamp: e.timestamp.toISOString(),
      direction: e.direction,
      result: e.result,
      reason: e.reason,
      gate: e.gate,
    })),
  });
}
