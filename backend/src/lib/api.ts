import { NextResponse } from "next/server";
import type { Member, MemberStatus } from "@prisma/client";
import { maskTckn } from "./tckn";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function error(message: string, status = 400, extra?: object) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export type MembershipState = {
  status: MemberStatus;
  active: boolean;
  expired: boolean;
  archived: boolean;
  daysLeft: number;
  membershipStart: string;
  membershipEnd: string;
};

/** Üyelik geçerlilik durumunu hesaplar. */
export function membershipState(member: Member): MembershipState {
  const now = new Date();
  const end = new Date(member.membershipEnd);
  const expired = end.getTime() < now.getTime();
  const archived = member.archivedAt !== null;
  const daysLeft = Math.ceil(
    (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  const active = member.status === "ACTIVE" && !expired && !archived;
  return {
    status: member.status,
    active,
    expired,
    archived,
    daysLeft,
    membershipStart: member.membershipStart.toISOString(),
    membershipEnd: member.membershipEnd.toISOString(),
  };
}

/** Üyeyi API yanıtı için serialize eder. tckn maskeli, hassas alanlar çıkarılır. */
export function serializeMember(member: Member, fullTckn = false) {
  return {
    id: member.id,
    tckn: fullTckn ? member.tckn : maskTckn(member.tckn),
    firstName: member.firstName,
    lastName: member.lastName,
    fullName: `${member.firstName} ${member.lastName}`,
    phone: member.phone,
    email: member.email,
    mustChangePassword: member.mustChangePassword,
    createdAt: member.createdAt.toISOString(),
    ...membershipState(member),
  };
}
