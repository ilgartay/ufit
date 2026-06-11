"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

export type Lang = "en" | "tr";

const STORAGE_KEY = "ufit_lang";

// ---- Çeviri sözlüğü ----
const dict = {
  en: {
    "nav.dashboard": "Dashboard",
    "nav.members": "Members",
    "nav.entries": "Entry Logs",
    "nav.scanner": "QR Scanner",
    "common.logout": "Log out",
    "common.loading": "Loading…",
    "common.save": "Save",
    "common.total": "Total",
    "common.search": "Search",

    "login.title": "uFIT Panel",
    "login.subtitle": "Staff login",
    "login.username": "Username",
    "login.password": "Password",
    "login.submit": "Sign in",
    "login.submitting": "Signing in…",
    "login.fail": "Sign in failed",

    "dash.title": "Overview",
    "dash.todayEntries": "Today's Entries",
    "dash.granted": "Approved",
    "dash.denied": "Denied",
    "dash.activeMembers": "Active Members",
    "dash.expiringTitle": "Memberships expiring soon (7 days)",
    "dash.noExpiring": "No upcoming membership expirations.",
    "dash.quickAction": "Quick action",
    "dash.totalMembers": "registered members.",
    "dash.totalPrefix": "Total",
    "dash.addManage": "Add / Manage Members",
    "dash.openScanner": "Open QR Scanner",

    "members.title": "Members",
    "members.new": "+ New Member",
    "members.closeForm": "Close Form",
    "members.searchPlaceholder": "Search name, surname, TCKN or phone…",
    "members.archiveToggle": "Archive",
    "members.activeToggle": "Active members",
    "members.colName": "Full Name",
    "members.colTckn": "TCKN",
    "members.colPhone": "Phone",
    "members.colEnd": "End",
    "members.colStatus": "Status",
    "members.notFound": "No members found.",
    "members.totalSuffix": "members",

    "status.active": "Active",
    "status.archived": "Archived",
    "status.suspended": "Suspended",
    "status.expired": "Expired",
    "status.passive": "Passive",

    "form.title": "New Member Registration",
    "form.tckn": "TCKN *",
    "form.phone": "Phone *",
    "form.firstName": "First name *",
    "form.lastName": "Last name *",
    "form.email": "E-mail",
    "form.start": "Start",
    "form.end": "End *",
    "form.save": "Save Member",
    "form.saving": "Saving…",
    "form.createdTitle": "✓ Member created",
    "form.credsInfo": "Login details to share with the member (shown only once):",
    "form.tcknLabel": "TCKN",
    "form.tempPwLabel": "Temporary password",
    "form.firstLoginNote": "The member will change their password on first login.",
    "form.smsConsole": "SMS (console mode): no real delivery, written to server log.",
    "form.smsSent": "SMS sent",
    "form.smsFailed": "SMS could not be sent",
    "form.okBtn": "Done",

    "detail.back": "← Members",
    "detail.info": "Information",
    "detail.phone": "Phone",
    "detail.email": "E-mail",
    "detail.startDate": "Membership start",
    "detail.endDate": "Membership end",
    "detail.daysLeft": "Days left",
    "detail.createdBy": "Created by",
    "detail.membershipMgmt": "Membership management",
    "detail.endDateLabel": "End date",
    "detail.statusLabel": "Status",
    "detail.saveBtn": "Save",
    "detail.resetPw": "Reset password",
    "detail.archiveSection": "Archive / Deletion",
    "detail.archive": "Archive",
    "detail.unarchive": "Unarchive",
    "detail.deletePermanent": "Delete permanently",
    "detail.deleteHint": "Permanent deletion requires administrator (ADMIN) privilege.",
    "detail.recentEntries": "Recent entry logs",
    "detail.noEntries": "No entry logs yet.",
    "detail.confirmReset": "Reset the member's password?",
    "detail.newTempPw": "New temporary password",
    "detail.smsConsoleLine": "(SMS in console mode — see server log)",
    "detail.smsSentLine": "SMS sent",
    "detail.smsFailedLine": "SMS could not be sent",
    "detail.confirmArchive":
      "Archive this member? Archived members cannot enter and are hidden from the list.",
    "detail.confirmUnarchive": "Unarchive this member?",
    "detail.archivedMsg": "Member archived.",
    "detail.unarchivedMsg": "Member unarchived.",
    "detail.confirmDelete":
      "The member and all entry logs will be PERMANENTLY deleted. This cannot be undone. Continue?",
    "detail.membershipUpdated": "Membership updated.",
    "detail.endAfterStart": "End date must be after the start date.",

    "entries.title": "Entry Logs",
    "entries.allResults": "All results",
    "entries.colTime": "Time",
    "entries.colMember": "Member",
    "entries.colDirection": "Direction",
    "entries.colResult": "Result",
    "entries.colReason": "Reason",
    "entries.notFound": "No records found.",
    "entries.clear": "Clear",
    "entries.totalSuffix": "records",

    "scanner.title": "QR Entry Scanner",
    "scanner.startCamera": "Start Camera",
    "scanner.stop": "Stop",
    "scanner.camError":
      "Could not access the camera. HTTPS/localhost and camera permission are required. You can use manual entry.",
    "scanner.manualLabel": "Manual token (for testing)",
    "scanner.manualPlaceholder": "Paste QR token",
    "scanner.send": "Send",
    "scanner.prompt": "Scan a QR code…",
    "scanner.granted": "ENTRY APPROVED",
    "scanner.denied": "DENIED",
    "scanner.inDir": "Entering",
    "scanner.outDir": "Exiting",
    "scanner.daysLeftSuffix": "days left",

    "dir.in": "Entry",
    "dir.out": "Exit",
    "res.granted": "Approved",
    "res.denied": "Denied",

    "reason.MEMBERSHIP_EXPIRED": "Membership expired",
    "reason.MEMBERSHIP_SUSPENDED": "Membership suspended",
    "reason.MEMBERSHIP_PASSIVE": "Membership passive",
    "reason.MEMBERSHIP_ARCHIVED": "Membership archived",
    "reason.MEMBERSHIP_INVALID": "Membership invalid",
    "reason.QR_EXPIRED": "QR code expired — please refresh",
    "reason.QR_BAD_FORMAT": "Invalid QR code",
    "reason.QR_BAD_SIGNATURE": "QR signature could not be verified",
    "reason.MEMBER_NOT_FOUND": "Member not found",
  },
  tr: {
    "nav.dashboard": "Panel",
    "nav.members": "Üyeler",
    "nav.entries": "Giriş Kayıtları",
    "nav.scanner": "QR Tarayıcı",
    "common.logout": "Çıkış",
    "common.loading": "Yükleniyor…",
    "common.save": "Kaydet",
    "common.total": "Toplam",
    "common.search": "Ara",

    "login.title": "uFIT Paneli",
    "login.subtitle": "Personel girişi",
    "login.username": "Kullanıcı adı",
    "login.password": "Şifre",
    "login.submit": "Giriş Yap",
    "login.submitting": "Giriş yapılıyor…",
    "login.fail": "Giriş başarısız",

    "dash.title": "Genel Bakış",
    "dash.todayEntries": "Bugünkü Giriş",
    "dash.granted": "Onaylanan",
    "dash.denied": "Reddedilen",
    "dash.activeMembers": "Aktif Üye",
    "dash.expiringTitle": "Üyeliği yaklaşan üyeler (7 gün)",
    "dash.noExpiring": "Yaklaşan üyelik bitişi yok.",
    "dash.quickAction": "Hızlı işlem",
    "dash.totalMembers": "kayıtlı üye.",
    "dash.totalPrefix": "Toplam",
    "dash.addManage": "Üye Ekle / Yönet",
    "dash.openScanner": "QR Tarayıcıyı Aç",

    "members.title": "Üyeler",
    "members.new": "+ Yeni Üye",
    "members.closeForm": "Formu Kapat",
    "members.searchPlaceholder": "Ad, soyad, TCKN veya telefon ara…",
    "members.archiveToggle": "Arşiv",
    "members.activeToggle": "Aktif üyeler",
    "members.colName": "Ad Soyad",
    "members.colTckn": "TCKN",
    "members.colPhone": "Telefon",
    "members.colEnd": "Bitiş",
    "members.colStatus": "Durum",
    "members.notFound": "Üye bulunamadı.",
    "members.totalSuffix": "üye",

    "status.active": "Aktif",
    "status.archived": "Arşivli",
    "status.suspended": "Askıda",
    "status.expired": "Süresi doldu",
    "status.passive": "Pasif",

    "form.title": "Yeni Üye Kaydı",
    "form.tckn": "TCKN *",
    "form.phone": "Telefon *",
    "form.firstName": "Ad *",
    "form.lastName": "Soyad *",
    "form.email": "E-posta",
    "form.start": "Başlangıç",
    "form.end": "Bitiş *",
    "form.save": "Üyeyi Kaydet",
    "form.saving": "Kaydediliyor…",
    "form.createdTitle": "✓ Üye oluşturuldu",
    "form.credsInfo":
      "Üyeye iletilecek giriş bilgileri (yalnızca bir kez gösterilir):",
    "form.tcknLabel": "TCKN",
    "form.tempPwLabel": "Geçici şifre",
    "form.firstLoginNote":
      "Üye mobil uygulamada ilk girişte şifresini değiştirecek.",
    "form.smsConsole":
      "SMS (console modu): gerçek gönderim yok, sunucu logunda.",
    "form.smsSent": "SMS gönderildi",
    "form.smsFailed": "SMS gönderilemedi",
    "form.okBtn": "Tamam",

    "detail.back": "← Üyeler",
    "detail.info": "Bilgiler",
    "detail.phone": "Telefon",
    "detail.email": "E-posta",
    "detail.startDate": "Üyelik başlangıç",
    "detail.endDate": "Üyelik bitiş",
    "detail.daysLeft": "Kalan gün",
    "detail.createdBy": "Kaydeden",
    "detail.membershipMgmt": "Üyelik yönetimi",
    "detail.endDateLabel": "Bitiş tarihi",
    "detail.statusLabel": "Durum",
    "detail.saveBtn": "Kaydet",
    "detail.resetPw": "Şifre sıfırla",
    "detail.archiveSection": "Arşiv / Silme",
    "detail.archive": "Arşivle",
    "detail.unarchive": "Arşivden çıkar",
    "detail.deletePermanent": "Kalıcı sil",
    "detail.deleteHint":
      "Kalıcı silme yalnızca yönetici (ADMIN) yetkisiyle yapılır.",
    "detail.recentEntries": "Son giriş kayıtları",
    "detail.noEntries": "Henüz giriş kaydı yok.",
    "detail.confirmReset": "Üyenin şifresi sıfırlansın mı?",
    "detail.newTempPw": "Yeni geçici şifre",
    "detail.smsConsoleLine": "(SMS console modunda — sunucu logunda)",
    "detail.smsSentLine": "SMS gönderildi",
    "detail.smsFailedLine": "SMS gönderilemedi",
    "detail.confirmArchive":
      "Üye arşivlensin mi? Arşivlenen üye giriş yapamaz ve listede gizlenir.",
    "detail.confirmUnarchive": "Üye arşivden çıkarılsın mı?",
    "detail.archivedMsg": "Üye arşivlendi.",
    "detail.unarchivedMsg": "Üye arşivden çıkarıldı.",
    "detail.confirmDelete":
      "Üye ve tüm giriş kayıtları KALICI olarak silinecek. Bu işlem geri alınamaz. Devam edilsin mi?",
    "detail.membershipUpdated": "Üyelik güncellendi.",
    "detail.endAfterStart": "Üyelik bitiş tarihi başlangıçtan sonra olmalı.",

    "entries.title": "Giriş Kayıtları",
    "entries.allResults": "Tüm sonuçlar",
    "entries.colTime": "Zaman",
    "entries.colMember": "Üye",
    "entries.colDirection": "Yön",
    "entries.colResult": "Sonuç",
    "entries.colReason": "Açıklama",
    "entries.notFound": "Kayıt bulunamadı.",
    "entries.clear": "Temizle",
    "entries.totalSuffix": "kayıt",

    "scanner.title": "QR Giriş Tarayıcı",
    "scanner.startCamera": "Kamerayı Başlat",
    "scanner.stop": "Durdur",
    "scanner.camError":
      "Kameraya erişilemedi. HTTPS/localhost ve kamera izni gerekiyor. Manuel girişi kullanabilirsiniz.",
    "scanner.manualLabel": "Manuel token (test için)",
    "scanner.manualPlaceholder": "QR token yapıştırın",
    "scanner.send": "Gönder",
    "scanner.prompt": "QR kodu okutun…",
    "scanner.granted": "GİRİŞ ONAYLANDI",
    "scanner.denied": "REDDEDİLDİ",
    "scanner.inDir": "İçeri giriş",
    "scanner.outDir": "Dışarı çıkış",
    "scanner.daysLeftSuffix": "gün kaldı",

    "dir.in": "Giriş",
    "dir.out": "Çıkış",
    "res.granted": "Onaylandı",
    "res.denied": "Reddedildi",

    "reason.MEMBERSHIP_EXPIRED": "Üyelik süresi dolmuş",
    "reason.MEMBERSHIP_SUSPENDED": "Üyelik askıya alınmış",
    "reason.MEMBERSHIP_PASSIVE": "Üyelik pasif",
    "reason.MEMBERSHIP_ARCHIVED": "Üyelik arşivlenmiş",
    "reason.MEMBERSHIP_INVALID": "Üyelik geçersiz",
    "reason.QR_EXPIRED": "QR kodunun süresi dolmuş — lütfen yenileyin",
    "reason.QR_BAD_FORMAT": "Geçersiz QR kodu",
    "reason.QR_BAD_SIGNATURE": "QR imzası doğrulanamadı",
    "reason.MEMBER_NOT_FOUND": "Üye bulunamadı",
  },
} as const;

export type TKey = keyof (typeof dict)["en"];

type I18nState = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey) => string;
  /** reason kodunu çevirir; bilinmeyen/serbest metni olduğu gibi döndürür. */
  tReason: (codeOrText: string | null | undefined) => string;
};

const I18nContext = createContext<I18nState | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = (typeof window !== "undefined" &&
      localStorage.getItem(STORAGE_KEY)) as Lang | null;
    if (saved === "en" || saved === "tr") setLangState(saved);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = useCallback(
    (key: TKey) => dict[lang][key] ?? dict.en[key] ?? key,
    [lang]
  );

  const tReason = useCallback(
    (codeOrText: string | null | undefined) => {
      if (!codeOrText) return "";
      const key = `reason.${codeOrText}` as TKey;
      const val = dict[lang][key];
      return val ?? codeOrText; // eski serbest metinler olduğu gibi gösterilir
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t, tReason }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within LanguageProvider");
  return ctx;
}
