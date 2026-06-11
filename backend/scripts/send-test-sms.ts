/**
 * Yapılandırılmış SMS sağlayıcısı üzerinden test mesajı gönderir.
 *
 * Kullanım:
 *   npm run test:sms -- <telefon> ["<mesaj>"]
 *
 * Örnek:
 *   npm run test:sms -- 05551234567
 *   npm run test:sms -- +905551234567 "uFIT test mesajı"
 *
 * Aktif sağlayıcı backend/.env içindeki SMS_PROVIDER ile belirlenir
 * (console / netgsm / twilio). Netgsm için NETGSM_USERCODE, NETGSM_PASSWORD,
 * NETGSM_MSGHEADER (ve opsiyonel NETGSM_APPKEY) dolu olmalıdır.
 */
import { sendSms, normalizePhone } from "../src/lib/sms";

async function main() {
  const [phone, customMessage] = process.argv.slice(2);
  if (!phone) {
    console.error('Kullanım: npm run test:sms -- <telefon> ["<mesaj>"]');
    process.exit(1);
  }

  const provider = process.env.SMS_PROVIDER || "console";
  const message =
    customMessage || "uFIT test mesaji - SMS entegrasyonu calisiyor.";

  console.log(`Sağlayıcı: ${provider}`);
  console.log(`Hedef    : ${normalizePhone(phone)}`);
  console.log(`Mesaj    : ${message}\n`);

  const result = await sendSms(phone, message);

  if (result.ok) {
    console.log(`✓ Gönderim başarılı (${result.provider}).`);
    if (result.provider === "console") {
      console.log("  (console modu: gerçek SMS gönderilmedi, yukarıdaki log mesajdır.)");
    }
  } else {
    console.error(`✗ Gönderim başarısız (${result.provider}): ${result.error}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
