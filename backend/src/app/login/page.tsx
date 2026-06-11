"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setSession, StaffInfo } from "@/lib/client";
import { useI18n } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("login.fail"));
      setSession(data.token, data.staff as StaffInfo);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("login.fail"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-3 flex justify-end">
          <LanguageSwitcher />
        </div>
        <div className="card">
          <div className="mb-6 text-center">
            <Logo size="lg" />
            <p className="mt-2 text-sm text-slate-500">{t("login.subtitle")}</p>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label">{t("login.username")}</label>
              <input
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="label">{t("login.password")}</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}
            <button type="submit" className="btn w-full" disabled={loading}>
              {loading ? t("login.submitting") : t("login.submit")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
