"use client";

import { useEffect, useRef, useState } from "react";
import PanelShell from "@/components/PanelShell";
import { api } from "@/lib/client";
import { useI18n } from "@/lib/i18n";

type ScanResult = {
  result: "GRANTED" | "DENIED";
  direction?: "IN" | "OUT";
  reason?: string | null;
  member?: { fullName?: string; daysLeft?: number };
};

export default function ScannerPage() {
  const { t } = useI18n();
  const [last, setLast] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manual, setManual] = useState("");
  const [camError, setCamError] = useState("");
  const lastTokenRef = useRef<{ token: string; at: number }>({
    token: "",
    at: 0,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null);

  async function submitToken(token: string) {
    const now = Date.now();
    if (
      token === lastTokenRef.current.token &&
      now - lastTokenRef.current.at < 4000
    ) {
      return;
    }
    lastTokenRef.current = { token, at: now };

    try {
      const res = await api<ScanResult>("/entry/scan", {
        method: "POST",
        body: JSON.stringify({ token, gate: "Main Gate" }),
      });
      setLast(res);
      beep(res.result === "GRANTED");
    } catch (e) {
      setLast({
        result: "DENIED",
        reason: e instanceof Error ? e.message : "Error",
      });
      beep(false);
    }
  }

  async function startCamera() {
    setCamError("");
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const el = document.getElementById("qr-reader");
      if (!el) return;
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded: string) => {
          submitToken(decoded);
        },
        () => {
          /* okuma hatası — yoksay */
        }
      );
      setScanning(true);
    } catch (e) {
      setCamError(t("scanner.camError"));
      console.error(e);
    }
  }

  async function stopCamera() {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch {
      /* yoksay */
    }
    setScanning(false);
  }

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <PanelShell>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">
        {t("scanner.title")}
      </h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div
            id="qr-reader"
            className="mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-lg bg-slate-900"
          />
          <div className="mt-4 flex gap-2">
            {!scanning ? (
              <button className="btn" onClick={startCamera}>
                {t("scanner.startCamera")}
              </button>
            ) : (
              <button className="btn-secondary" onClick={stopCamera}>
                {t("scanner.stop")}
              </button>
            )}
          </div>
          {camError && <p className="mt-3 text-sm text-amber-600">{camError}</p>}

          <div className="mt-6 border-t border-slate-100 pt-4">
            <label className="label">{t("scanner.manualLabel")}</label>
            <div className="flex gap-2">
              <input
                className="input font-mono"
                placeholder={t("scanner.manualPlaceholder")}
                value={manual}
                onChange={(e) => setManual(e.target.value)}
              />
              <button
                className="btn-secondary"
                onClick={() => manual && submitToken(manual.trim())}
              >
                {t("scanner.send")}
              </button>
            </div>
          </div>
        </div>

        <ResultPanel result={last} />
      </div>
    </PanelShell>
  );
}

function ResultPanel({ result }: { result: ScanResult | null }) {
  const { t, tReason } = useI18n();
  if (!result) {
    return (
      <div className="card flex min-h-[300px] items-center justify-center text-slate-300">
        {t("scanner.prompt")}
      </div>
    );
  }
  const granted = result.result === "GRANTED";
  return (
    <div
      className={`card flex min-h-[300px] flex-col items-center justify-center text-center ${
        granted ? "bg-green-50" : "bg-red-50"
      }`}
    >
      <div className="text-6xl">{granted ? "✅" : "⛔"}</div>
      <h2
        className={`mt-3 text-2xl font-bold ${
          granted ? "text-green-700" : "text-red-700"
        }`}
      >
        {granted ? t("scanner.granted") : t("scanner.denied")}
      </h2>
      {result.member?.fullName && (
        <p className="mt-2 text-lg font-medium text-slate-700">
          {result.member.fullName}
        </p>
      )}
      {granted && result.direction && (
        <p className="mt-1 text-slate-500">
          {result.direction === "IN" ? t("scanner.inDir") : t("scanner.outDir")}
          {typeof result.member?.daysLeft === "number" &&
            ` · ${result.member.daysLeft} ${t("scanner.daysLeftSuffix")}`}
        </p>
      )}
      {result.reason && <p className="mt-2 text-red-600">{tReason(result.reason)}</p>}
    </div>
  );
}

function beep(success: boolean) {
  try {
    const ctx = new (window.AudioContext ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = success ? 880 : 220;
    gain.gain.value = 0.1;
    osc.start();
    setTimeout(
      () => {
        osc.stop();
        ctx.close();
      },
      success ? 150 : 400
    );
  } catch {
    /* ses yoksa yoksay */
  }
}
