"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import PanelShell from "@/components/PanelShell";
import { api } from "@/lib/client";
import { useI18n } from "@/lib/i18n";

type Member = {
  id: string;
  tckn: string;
  fullName: string;
  phone: string;
  status: string;
  active: boolean;
  archived: boolean;
  daysLeft: number;
  membershipEnd: string;
};

type ListResp = { total: number; page: number; members: Member[] };

function StatusBadge({ m }: { m: Member }) {
  const { t } = useI18n();
  if (m.archived)
    return <span className="badge bg-slate-200 text-slate-500">{t("status.archived")}</span>;
  if (m.active)
    return <span className="badge bg-green-100 text-green-700">{t("status.active")}</span>;
  if (m.status === "SUSPENDED")
    return <span className="badge bg-amber-100 text-amber-700">{t("status.suspended")}</span>;
  if (m.daysLeft < 0)
    return <span className="badge bg-red-100 text-red-700">{t("status.expired")}</span>;
  return <span className="badge bg-slate-200 text-slate-600">{t("status.passive")}</span>;
}

export default function MembersPage() {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [data, setData] = useState<ListResp | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const load = useCallback(async (query: string, archived: boolean) => {
    const res = await api<ListResp>(
      `/members?q=${encodeURIComponent(query)}${archived ? "&archived=1" : ""}`
    );
    setData(res);
  }, []);

  useEffect(() => {
    load(q, showArchived);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showArchived]);

  return (
    <PanelShell>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">{t("members.title")}</h1>
        <button className="btn" onClick={() => setShowForm((s) => !s)}>
          {showForm ? t("members.closeForm") : t("members.new")}
        </button>
      </div>

      {showForm && (
        <NewMemberForm
          onCreated={() => {
            setShowForm(false);
            setShowArchived(false);
            load(q, false);
          }}
        />
      )}

      <form
        className="mb-4 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          load(q, showArchived);
        }}
      >
        <input
          className="input flex-1"
          placeholder={t("members.searchPlaceholder")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn-secondary" type="submit">
          {t("common.search")}
        </button>
        <button
          type="button"
          className={showArchived ? "btn" : "btn-secondary"}
          onClick={() => setShowArchived((s) => !s)}
        >
          {showArchived ? t("members.activeToggle") : t("members.archiveToggle")}
        </button>
      </form>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-4 py-3">{t("members.colName")}</th>
              <th className="px-4 py-3">{t("members.colTckn")}</th>
              <th className="px-4 py-3">{t("members.colPhone")}</th>
              <th className="px-4 py-3">{t("members.colEnd")}</th>
              <th className="px-4 py-3">{t("members.colStatus")}</th>
            </tr>
          </thead>
          <tbody>
            {data?.members.map((m) => (
              <tr
                key={m.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/members/${m.id}`}
                    className="font-medium text-brand-dark hover:underline"
                  >
                    {m.fullName}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-slate-500">{m.tckn}</td>
                <td className="px-4 py-3 text-slate-600">{m.phone}</td>
                <td className="px-4 py-3 text-slate-600">
                  {new Date(m.membershipEnd).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge m={m} />
                </td>
              </tr>
            ))}
            {data && data.members.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  {t("members.notFound")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {data && (
        <p className="mt-3 text-sm text-slate-400">
          {t("common.total")} {data.total} {t("members.totalSuffix")}
        </p>
      )}
    </PanelShell>
  );
}

function NewMemberForm({ onCreated }: { onCreated: () => void }) {
  const { t } = useI18n();
  const today = new Date().toISOString().slice(0, 10);
  const oneYear = new Date();
  oneYear.setFullYear(oneYear.getFullYear() + 1);

  const [form, setForm] = useState({
    tckn: "",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    membershipStart: today,
    membershipEnd: oneYear.toISOString().slice(0, 10),
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    tckn: string;
    tempPassword: string;
    sms?: { sent: boolean; provider: string; error?: string };
  } | null>(null);

  function upd(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api<{
        member: { tckn: string };
        tempPassword: string;
        sms?: { sent: boolean; provider: string; error?: string };
      }>("/members", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          membershipStart: new Date(form.membershipStart).toISOString(),
          membershipEnd: new Date(form.membershipEnd).toISOString(),
        }),
      });
      setResult({
        tckn: res.member.tckn,
        tempPassword: res.tempPassword,
        sms: res.sms,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="card mb-6 border-green-200 bg-green-50">
        <h2 className="font-semibold text-green-800">{t("form.createdTitle")}</h2>
        <p className="mt-2 text-sm text-slate-700">{t("form.credsInfo")}</p>
        <div className="mt-2 rounded-lg bg-white p-3 font-mono text-sm">
          <div>{t("form.tcknLabel")}: {result.tckn}</div>
          <div>
            {t("form.tempPwLabel")}: <strong>{result.tempPassword}</strong>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">{t("form.firstLoginNote")}</p>
        {result.sms && (
          <p
            className={`mt-1 text-xs ${
              result.sms.sent ? "text-green-700" : "text-amber-600"
            }`}
          >
            {result.sms.sent
              ? result.sms.provider === "console"
                ? t("form.smsConsole")
                : `${t("form.smsSent")} (${result.sms.provider}).`
              : `${t("form.smsFailed")}: ${result.sms.error || ""}`}
          </p>
        )}
        <button className="btn mt-4" onClick={onCreated}>
          {t("form.okBtn")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card mb-6 space-y-4">
      <h2 className="font-semibold text-slate-700">{t("form.title")}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{t("form.tckn")}</label>
          <input
            className="input font-mono"
            maxLength={11}
            value={form.tckn}
            onChange={(e) => upd("tckn", e.target.value.replace(/\D/g, ""))}
            required
          />
        </div>
        <div>
          <label className="label">{t("form.phone")}</label>
          <input
            className="input"
            value={form.phone}
            onChange={(e) => upd("phone", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">{t("form.firstName")}</label>
          <input
            className="input"
            value={form.firstName}
            onChange={(e) => upd("firstName", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">{t("form.lastName")}</label>
          <input
            className="input"
            value={form.lastName}
            onChange={(e) => upd("lastName", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">{t("form.email")}</label>
          <input
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => upd("email", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">{t("form.start")}</label>
            <input
              type="date"
              className="input"
              value={form.membershipStart}
              onChange={(e) => upd("membershipStart", e.target.value)}
            />
          </div>
          <div>
            <label className="label">{t("form.end")}</label>
            <input
              type="date"
              className="input"
              value={form.membershipEnd}
              onChange={(e) => upd("membershipEnd", e.target.value)}
              required
            />
          </div>
        </div>
      </div>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      <button className="btn" disabled={loading}>
        {loading ? t("form.saving") : t("form.save")}
      </button>
    </form>
  );
}
