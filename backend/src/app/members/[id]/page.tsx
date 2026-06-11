"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PanelShell from "@/components/PanelShell";
import { api, getStaff } from "@/lib/client";
import { useI18n } from "@/lib/i18n";

type MemberDetail = {
  id: string;
  tckn: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  status: string;
  active: boolean;
  archived: boolean;
  daysLeft: number;
  membershipStart: string;
  membershipEnd: string;
};

type Entry = {
  id: string;
  timestamp: string;
  direction: string;
  result: string;
  reason: string | null;
};

type Resp = {
  member: MemberDetail;
  entries: Entry[];
  createdBy: { username: string; fullName: string } | null;
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString();
}

export default function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { t, tReason } = useI18n();
  const [data, setData] = useState<Resp | null>(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [end, setEnd] = useState("");
  const [status, setStatus] = useState("");
  const isAdmin = getStaff()?.role === "ADMIN";

  async function load() {
    try {
      const res = await api<Resp>(`/members/${id}`);
      setData(res);
      setEnd(res.member.membershipEnd.slice(0, 10));
      setStatus(res.member.status);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function saveMembership() {
    setMsg("");
    try {
      await api(`/members/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          membershipEnd: new Date(end).toISOString(),
          status,
        }),
      });
      setMsg(t("detail.membershipUpdated"));
      load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    }
  }

  async function resetPassword() {
    if (!confirm(t("detail.confirmReset"))) return;
    try {
      const res = await api<{
        tempPassword: string;
        sms?: { sent: boolean; provider: string; error?: string };
      }>(`/members/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ resetPassword: true }),
      });
      const smsLine = res.sms
        ? res.sms.sent
          ? res.sms.provider === "console"
            ? `\n${t("detail.smsConsoleLine")}`
            : `\n${t("detail.smsSentLine")} (${res.sms.provider}).`
          : `\n${t("detail.smsFailedLine")}: ${res.sms.error || ""}`
        : "";
      alert(`${t("detail.newTempPw")}: ${res.tempPassword}${smsLine}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    }
  }

  async function toggleArchive() {
    if (!data) return;
    const archiving = !data.member.archived;
    if (!confirm(archiving ? t("detail.confirmArchive") : t("detail.confirmUnarchive")))
      return;
    setMsg("");
    try {
      await api(`/members/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ archived: archiving }),
      });
      setMsg(archiving ? t("detail.archivedMsg") : t("detail.unarchivedMsg"));
      load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    }
  }

  async function deleteMember() {
    if (!confirm(t("detail.confirmDelete"))) return;
    try {
      await api(`/members/${id}`, { method: "DELETE" });
      router.replace("/members");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    }
  }

  return (
    <PanelShell>
      <Link href="/members" className="text-sm text-slate-400 hover:underline">
        {t("detail.back")}
      </Link>
      {error && <p className="mt-4 text-red-600">{error}</p>}
      {!data ? (
        <p className="mt-4 text-slate-400">{t("common.loading")}</p>
      ) : (
        <>
          <h1 className="mb-1 mt-2 flex items-center gap-2 text-2xl font-bold text-slate-800">
            {data.member.fullName}
            {data.member.archived && (
              <span className="badge bg-slate-200 text-slate-500">
                {t("status.archived")}
              </span>
            )}
          </h1>
          <p className="mb-6 font-mono text-sm text-slate-500">{data.member.tckn}</p>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card space-y-2 text-sm">
              <h2 className="mb-2 font-semibold text-slate-700">{t("detail.info")}</h2>
              <Row label={t("detail.phone")} value={data.member.phone} />
              <Row label={t("detail.email")} value={data.member.email || "—"} />
              <Row
                label={t("detail.startDate")}
                value={new Date(data.member.membershipStart).toLocaleDateString()}
              />
              <Row
                label={t("detail.endDate")}
                value={new Date(data.member.membershipEnd).toLocaleDateString()}
              />
              <Row label={t("detail.daysLeft")} value={String(data.member.daysLeft)} />
              {data.createdBy && (
                <Row label={t("detail.createdBy")} value={data.createdBy.fullName} />
              )}
            </div>

            <div className="card space-y-4">
              <h2 className="font-semibold text-slate-700">
                {t("detail.membershipMgmt")}
              </h2>
              <div>
                <label className="label">{t("detail.endDateLabel")}</label>
                <input
                  type="date"
                  className="input"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </div>
              <div>
                <label className="label">{t("detail.statusLabel")}</label>
                <select
                  className="input"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="ACTIVE">{t("status.active")}</option>
                  <option value="PASSIVE">{t("status.passive")}</option>
                  <option value="SUSPENDED">{t("status.suspended")}</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="btn" onClick={saveMembership}>
                  {t("detail.saveBtn")}
                </button>
                <button className="btn-secondary" onClick={resetPassword}>
                  {t("detail.resetPw")}
                </button>
              </div>
              {msg && <p className="text-sm text-green-600">{msg}</p>}

              <div className="mt-2 border-t border-slate-100 pt-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                  {t("detail.archiveSection")}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button className="btn-secondary" onClick={toggleArchive}>
                    {data.member.archived ? t("detail.unarchive") : t("detail.archive")}
                  </button>
                  {isAdmin && (
                    <button
                      className="inline-flex items-center justify-center rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                      onClick={deleteMember}
                    >
                      {t("detail.deletePermanent")}
                    </button>
                  )}
                </div>
                {!isAdmin && (
                  <p className="mt-1 text-xs text-slate-400">{t("detail.deleteHint")}</p>
                )}
              </div>
            </div>
          </div>

          <div className="card mt-4 overflow-x-auto p-0">
            <h2 className="border-b border-slate-100 px-4 py-3 font-semibold text-slate-700">
              {t("detail.recentEntries")}
            </h2>
            <table className="w-full text-sm">
              <tbody>
                {data.entries.map((e) => (
                  <tr key={e.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2 text-slate-600">{fmt(e.timestamp)}</td>
                    <td className="px-4 py-2">
                      {e.direction === "IN" ? t("dir.in") : t("dir.out")}
                    </td>
                    <td className="px-4 py-2">
                      {e.result === "GRANTED" ? (
                        <span className="badge bg-green-100 text-green-700">
                          {t("res.granted")}
                        </span>
                      ) : (
                        <span className="badge bg-red-100 text-red-700">
                          {t("res.denied")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-slate-400">{tReason(e.reason)}</td>
                  </tr>
                ))}
                {data.entries.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-slate-400">
                      {t("detail.noEntries")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </PanelShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-700">{value}</span>
    </div>
  );
}
