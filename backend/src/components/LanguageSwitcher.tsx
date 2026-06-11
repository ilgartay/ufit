"use client";

import { useI18n, Lang } from "@/lib/i18n";

const OPTIONS: { lang: Lang; flag: string; label: string }[] = [
  { lang: "en", flag: "🇬🇧", label: "EN" },
  { lang: "tr", flag: "🇹🇷", label: "TR" },
];

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useI18n();
  return (
    <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-0.5">
      {OPTIONS.map((o) => {
        const active = lang === o.lang;
        return (
          <button
            key={o.lang}
            onClick={() => setLang(o.lang)}
            title={o.label}
            aria-label={o.label}
            className={`flex items-center gap-1 rounded-full px-2 py-1 text-sm transition ${
              active
                ? "bg-brand/10 text-brand-dark"
                : "text-slate-400 hover:bg-slate-100"
            }`}
          >
            <span className="text-base leading-none">{o.flag}</span>
            {!compact && <span className="text-xs font-medium">{o.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
