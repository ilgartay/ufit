/**
 * SMS gönderim soyutlaması.
 *
 * SMS_PROVIDER ortam değişkeni ile sağlayıcı seçilir:
 *   - "console" (varsayılan): gerçek SMS göndermez, sunucu loguna yazar.
 *                             Geliştirme/demo için idealdir.
 *   - "netgsm":  Netgsm HTTP API (Türkiye).
 *   - "twilio":  Twilio REST API (global).
 *
 * Gerçek gönderim için ilgili sağlayıcının ortam değişkenlerini doldurun.
 */

export type SmsResult = {
  ok: boolean;
  provider: string;
  error?: string;
};

/** Telefon numarasını Türkiye için E.164 (+90...) biçimine getirir. */
export function normalizePhone(raw: string): string {
  let p = raw.replace(/[^\d+]/g, "");
  if (p.startsWith("+")) return p;
  p = p.replace(/\D/g, "");
  if (p.startsWith("0")) p = p.slice(1);
  if (p.startsWith("90")) return `+${p}`;
  if (p.length === 10) return `+90${p}`; // 5XXXXXXXXX
  return `+${p}`;
}

export async function sendSms(to: string, message: string): Promise<SmsResult> {
  const provider = (process.env.SMS_PROVIDER || "console").toLowerCase();
  const phone = normalizePhone(to);

  try {
    switch (provider) {
      case "netgsm":
        return await sendViaNetgsm(phone, message);
      case "twilio":
        return await sendViaTwilio(phone, message);
      case "console":
      default:
        console.log(`\n[SMS:console] -> ${phone}\n${message}\n`);
        return { ok: true, provider: "console" };
    }
  } catch (e) {
    return {
      ok: false,
      provider,
      error: e instanceof Error ? e.message : "SMS gönderilemedi",
    };
  }
}

/** Üyeye giriş/şifre bilgisini içeren standart mesaj metni. */
export function buildPasswordSms(
  fullName: string,
  tckn: string,
  tempPassword: string
): string {
  return (
    `Sayin ${fullName}, spor salonu uyeliginiz olusturuldu. ` +
    `Mobil uygulama girisi -> TCKN: ${tckn}, Gecici sifre: ${tempPassword}. ` +
    `Ilk giriste sifrenizi degistirin.`
  );
}

// ---- Sağlayıcı implementasyonları ----

/** Netgsm yanıt kodlarının okunabilir açıklamaları (resmi dokümana göre). */
const NETGSM_CODES: Record<string, string> = {
  "00": "Başarılı",
  "01": "Başarılı (1 numara hatalı)",
  "02": "Başarılı (mesaj başlığı sistemde kayıtlı değil — yine de gönderildi)",
  "20": "Mesaj metni hatalı veya karakter sınırı aşıldı",
  "30": "Geçersiz kullanıcı adı/şifre, API erişimi yok veya IP kısıtlaması",
  "40": "Mesaj başlığı (gönderici adı) sistemde tanımlı değil",
  "50": "IYS kontrollü gönderim hatası (alıcı/IYS izni)",
  "51": "IYS marka bilgisi eksik",
  "70": "Hatalı veya eksik parametre",
  "80": "Gönderim sınırı aşıldı",
  "85": "Mükerrer gönderim sınırı (aynı numaraya 1 dk içinde 20+ istek)",
};

async function sendViaNetgsm(phone: string, message: string): Promise<SmsResult> {
  const usercode = process.env.NETGSM_USERCODE;
  const password = process.env.NETGSM_PASSWORD;
  const header = process.env.NETGSM_MSGHEADER; // onaylı gönderici başlığı
  const appkey = process.env.NETGSM_APPKEY; // opsiyonel API anahtarı
  if (!usercode || !password || !header) {
    throw new Error(
      "Netgsm ortam değişkenleri eksik (NETGSM_USERCODE, NETGSM_PASSWORD, NETGSM_MSGHEADER)"
    );
  }
  // Netgsm numarayı başında 0/+ olmadan, ülke kodlu bekler (90...)
  const gsmno = phone.replace(/^\+/, "");
  const params = new URLSearchParams({
    usercode,
    password,
    gsmno,
    message,
    msgheader: header,
  });
  if (appkey) params.set("appkey", appkey);

  const res = await fetch("https://api.netgsm.com.tr/sms/send/get/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!res.ok) {
    throw new Error(`Netgsm HTTP ${res.status}`);
  }

  const text = (await res.text()).trim();
  // Başarıda "00 <jobid>" / "01 <jobid>" / "02 <jobid>" döner; diğerleri hata kodu.
  const code = text.split(/\s+/)[0];
  if (code === "00" || code === "01" || code === "02") {
    return { ok: true, provider: "netgsm" };
  }
  const detail = NETGSM_CODES[code] || "Bilinmeyen hata";
  throw new Error(`Netgsm hata ${code}: ${detail}`);
}

async function sendViaTwilio(phone: string, message: string): Promise<SmsResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (!sid || !token || !from) {
    throw new Error("Twilio ortam değişkenleri eksik");
  }
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: phone, From: from, Body: message }).toString(),
    }
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { message?: string }).message || `Twilio HTTP ${res.status}`
    );
  }
  return { ok: true, provider: "twilio" };
}
