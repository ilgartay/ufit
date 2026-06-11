import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffFromRequest } from "@/lib/auth";
import { json, error } from "@/lib/api";

// GET /api/entries?memberId=&date=YYYY-MM-DD&result=GRANTED|DENIED&page=1
export async function GET(req: NextRequest) {
  const staff = getStaffFromRequest(req);
  if (!staff) return error("Yetkisiz", 401);

  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId") || undefined;
  const result = searchParams.get("result") || undefined;
  const date = searchParams.get("date") || undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = 30;

  const where: Record<string, unknown> = {};
  if (memberId) where.memberId = memberId;
  if (result === "GRANTED" || result === "DENIED") where.result = result;
  if (date) {
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59.999`);
    if (!isNaN(start.getTime())) {
      where.timestamp = { gte: start, lte: end };
    }
  }

  const [total, entries] = await Promise.all([
    prisma.entryLog.count({ where }),
    prisma.entryLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        member: { select: { firstName: true, lastName: true, tckn: true } },
      },
    }),
  ]);

  return json({
    total,
    page,
    pageSize,
    entries: entries.map((e) => ({
      id: e.id,
      timestamp: e.timestamp.toISOString(),
      direction: e.direction,
      result: e.result,
      reason: e.reason,
      gate: e.gate,
      member: {
        fullName: `${e.member.firstName} ${e.member.lastName}`,
      },
    })),
  });
}
