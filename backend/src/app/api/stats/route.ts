import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffFromRequest } from "@/lib/auth";
import { json, error } from "@/lib/api";

export async function GET(req: NextRequest) {
  const staff = getStaffFromRequest(req);
  if (!staff) return error("Yetkisiz", 401);

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const in7days = new Date(now);
  in7days.setDate(in7days.getDate() + 7);

  const [todayEntries, todayGranted, totalMembers, activeMembers, expiringSoon] =
    await Promise.all([
      prisma.entryLog.count({ where: { timestamp: { gte: startOfDay } } }),
      prisma.entryLog.count({
        where: { timestamp: { gte: startOfDay }, result: "GRANTED" },
      }),
      prisma.member.count({ where: { archivedAt: null } }),
      prisma.member.count({
        where: { status: "ACTIVE", membershipEnd: { gte: now }, archivedAt: null },
      }),
      prisma.member.findMany({
        where: {
          status: "ACTIVE",
          membershipEnd: { gte: now, lte: in7days },
          archivedAt: null,
        },
        orderBy: { membershipEnd: "asc" },
        take: 10,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          membershipEnd: true,
        },
      }),
    ]);

  return json({
    todayEntries,
    todayGranted,
    todayDenied: todayEntries - todayGranted,
    totalMembers,
    activeMembers,
    expiringSoon: expiringSoon.map((m) => ({
      id: m.id,
      fullName: `${m.firstName} ${m.lastName}`,
      membershipEnd: m.membershipEnd.toISOString(),
    })),
  });
}
