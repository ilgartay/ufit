"use client";

import { useEffect, useState, useCallback } from "react";
import PanelShell from "@/components/PanelShell";
import { api } from "@/lib/client";
import { useI18n } from "@/lib/i18n";

type Entry = {
  id: string;
  timestamp: string;
  direction: string;
  result: string;
  reason: string | null;
  gate: string | null;
  member: { fullName: string };
};

type Resp = { total: number; entries: Entry[] };

export default function EntriesPage() {
  const { t, tReason } = useI18n();
  const [date, setDate] = useState("");
  const [result, setResult] = useState("");
  const [data, setData] = useState<Resp | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (result) params.set("result", result);
    const res = await api<Resp>(`/entries?${params.toString()}`);
    setData(res);
  }, [date, result]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <PanelShell>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">{t("entries.title")}</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="date"
          className="input max-w-[180px]"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <select
          className="input max-w-[180px]"
          value={result}
          onChange={(e) => setResult(e.target.value)}
        >
          <option value="">{t("entries.allResults")}</option>
          <option value="GRANTED">{t("dash.granted")}</option>
          <option value="DENIED">{t("dash.denied")}</option>
        </select>
        {(date || result) && (
          <button
            className="btn-secondary"
            onClick={() => {
              setDate("");
              setResult("");
            }}
          >
            {t("entries.clear")}
          </button>
        )}
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-4 py-3">{t("entries.colTime")}</th>
              <th className="px-4 py-3">{t("entries.colMember")}</th>
              <th className="px-4 py-3">{t("entries.colDirection")}</th>
              <th className="px-4 py-3">{t("entries.colResult")}</th>
              <th className="px-4 py-3">{t("entries.colReason")}</th>
            </tr>
          </thead>
          <tbody>
            {data?.entries.map((e) => (
              <tr
                key={e.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
              >
                <td className="px-4 py-3 text-slate-600">
                  {new Date(e.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-3 font-medium text-slate-700">
                  {e.member.fullName}
                </td>
                <td className="px-4 py-3">
                  {e.direction === "IN" ? t("dir.in") : t("dir.out")}
                </td>
                <td className="px-4 py-3">
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
                <td className="px-4 py-3 text-slate-400">{tReason(e.reason)}</td>
              </tr>
            ))}
            {data && data.entries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  {t("entries.notFound")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {data && (
        <p className="mt-3 text-sm text-slate-400">
          {t("common.total")} {data.total} {t("entries.totalSuffix")}
        </p>
      )}
    </PanelShell>
  );
}
