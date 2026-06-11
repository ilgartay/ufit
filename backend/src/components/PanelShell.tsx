"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getStaff, getToken, logout, StaffInfo } from "@/lib/client";
import { useI18n, TKey } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Logo from "@/components/Logo";

const NAV: { href: string; key: TKey }[] = [
  { href: "/", key: "nav.dashboard" },
  { href: "/members", key: "nav.members" },
  { href: "/entries", key: "nav.entries" },
  { href: "/scanner", key: "nav.scanner" },
];

export default function PanelShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();
  const [staff, setStaff] = useState<StaffInfo | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    setStaff(getStaff());
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        {t("common.loading")}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Logo />
            <nav className="hidden gap-1 sm:flex">
              {NAV.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                      active
                        ? "bg-brand/10 text-brand-dark"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {t(item.key)}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher compact />
            <span className="hidden text-sm text-slate-500 sm:inline">
              {staff?.fullName}
            </span>
            <button
              onClick={() => {
                logout();
                router.replace("/login");
              }}
              className="text-sm text-slate-400 hover:text-slate-700"
            >
              {t("common.logout")}
            </button>
          </div>
        </div>
        {/* mobil nav */}
        <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-2 py-1 sm:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-slate-600"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
