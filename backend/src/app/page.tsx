"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PanelShell from "@/components/PanelShell";
import { api } from "@/lib/client";
import { useI18n } from "@/lib/i18n";

type Stats = {
  todayEntries: number;
  todayGranted: number;
  todayDenied: number;
  totalMembers: number;
  activeMembers: number;
  expiringSoon: { id: string; fullName: string; membershipEnd: string }[];
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString();
}

export default function DashboardPage() {
  const { t } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Stats>("/stats")
      .then(setStats)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <PanelShell>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">{t("dash.title")}</h1>
      {error && <p className="text-red-600">{error}</p>}
      {!stats ? (
        <p className="text-slate-400">{t("common.loading")}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label={t("dash.todayEntries")} value={stats.todayEntries} />
            <Stat label={t("dash.granted")} value={stats.todayGranted} tone="green" />
            <Stat label={t("dash.denied")} value={stats.todayDenied} tone="red" />
            <Stat label={t("dash.activeMembers")} value={stats.activeMembers} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="card">
              <h2 className="mb-3 font-semibold text-slate-700">
                {t("dash.expiringTitle")}
              </h2>
              {stats.expiringSoon.length === 0 ? (
                <p className="text-sm text-slate-400">{t("dash.noExpiring")}</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {stats.expiringSoon.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center justify-between py-2"
                    >
                      <Link
                        href={`/members/${m.id}`}
                        className="text-sm font-medium text-brand-dark hover:underline"
                      >
                        {m.fullName}
                      </Link>
                      <span className="text-sm text-slate-500">
                        {fmtDate(m.membershipEnd)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card flex flex-col justify-between">
              <div>
                <h2 className="mb-1 font-semibold text-slate-700">
                  {t("dash.quickAction")}
                </h2>
                <p className="text-sm text-slate-500">
                  {t("dash.totalPrefix")} {stats.totalMembers} {t("dash.totalMembers")}
                </p>
              </div>
              <div className="mt-4 flex gap-3">
                <Link href="/members" className="btn">
                  {t("dash.addManage")}
                </Link>
                <Link href="/scanner" className="btn-secondary">
                  {t("dash.openScanner")}
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </PanelShell>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "green" | "red";
}) {
  const color =
    tone === "green"
      ? "text-green-600"
      : tone === "red"
      ? "text-red-600"
      : "text-slate-800";
  return (
    <div className="card">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
