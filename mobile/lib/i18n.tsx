import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import * as SecureStore from "expo-secure-store";

export type Lang = "en" | "tr";

const STORAGE_KEY = "ufit_lang";

const dict = {
  en: {
    "login.subtitle": "Member Login",
    "login.tckn": "TCKN (National ID)",
    "login.tcknPlaceholder": "11-digit ID number",
    "login.password": "Password",
    "login.passwordPlaceholder": "Your password",
    "login.submit": "Sign in",
    "login.tcknLen": "TCKN must be 11 digits",
    "login.fail": "Sign in failed",
    "login.hint": "You can get your login details from the gym staff.",

    "cpw.title": "Set Your Password",
    "cpw.subtitle": "Please change your temporary password for security.",
    "cpw.current": "Current (temporary) password",
    "cpw.new": "New password",
    "cpw.confirm": "New password (repeat)",
    "cpw.save": "Save",
    "cpw.errMin": "New password must be at least 6 characters",
    "cpw.errMatch": "New passwords do not match",

    "tab.card": "My Card",
    "tab.history": "History",
    "tab.profile": "Profile",

    "card.greeting": "Hello,",
    "card.member": "Member",
    "card.statusActive": "Membership active",
    "card.daysLeft": "days left",
    "card.statusExpired": "Membership expired",
    "card.statusPassive": "Membership inactive",
    "card.qrTitle": "Entry QR Code",
    "card.countdown": "Code refreshes in",
    "card.seconds": "sec",
    "card.hint":
      "Scan this code at the entry turnstile. For security, the code refreshes regularly.",
    "card.qrError": "Could not get QR",

    "history.header": "Entry History",
    "history.empty": "You have no entry records yet.",

    "profile.header": "Profile",
    "profile.tckn": "TCKN",
    "profile.phone": "Phone",
    "profile.startDate": "Membership start",
    "profile.endDate": "Membership end",
    "profile.status": "Status",
    "profile.statusActive": "Active",
    "profile.statusExpired": "Expired",
    "profile.statusPassive": "Inactive",
    "profile.logout": "Log out",

    "dir.in": "Entry",
    "dir.out": "Exit",
    "res.granted": "Approved",
    "res.denied": "Denied",

    "reason.MEMBERSHIP_EXPIRED": "Membership expired",
    "reason.MEMBERSHIP_SUSPENDED": "Membership suspended",
    "reason.MEMBERSHIP_PASSIVE": "Membership passive",
    "reason.MEMBERSHIP_ARCHIVED": "Membership archived",
    "reason.MEMBERSHIP_INVALID": "Membership invalid",
    "reason.QR_EXPIRED": "QR code expired",
    "reason.QR_BAD_FORMAT": "Invalid QR code",
    "reason.QR_BAD_SIGNATURE": "QR signature invalid",
    "reason.MEMBER_NOT_FOUND": "Member not found",
  },
  tr: {
    "login.subtitle": "Üye Girişi",
    "login.tckn": "TCKN",
    "login.tcknPlaceholder": "11 haneli kimlik no",
    "login.password": "Şifre",
    "login.passwordPlaceholder": "Şifreniz",
    "login.submit": "Giriş Yap",
    "login.tcknLen": "TCKN 11 haneli olmalı",
    "login.fail": "Giriş başarısız",
    "login.hint": "Giriş bilgilerinizi spor salonu personelinden alabilirsiniz.",

    "cpw.title": "Şifrenizi Belirleyin",
    "cpw.subtitle": "Güvenliğiniz için geçici şifrenizi değiştirin.",
    "cpw.current": "Mevcut (geçici) şifre",
    "cpw.new": "Yeni şifre",
    "cpw.confirm": "Yeni şifre (tekrar)",
    "cpw.save": "Kaydet",
    "cpw.errMin": "Yeni şifre en az 6 karakter olmalı",
    "cpw.errMatch": "Yeni şifreler eşleşmiyor",

    "tab.card": "Kartım",
    "tab.history": "Geçmiş",
    "tab.profile": "Profil",

    "card.greeting": "Merhaba,",
    "card.member": "Üye",
    "card.statusActive": "Üyelik aktif",
    "card.daysLeft": "gün kaldı",
    "card.statusExpired": "Üyelik süresi dolmuş",
    "card.statusPassive": "Üyelik pasif",
    "card.qrTitle": "Giriş QR Kodu",
    "card.countdown": "Kod yenilenecek:",
    "card.seconds": "sn",
    "card.hint":
      "Bu kodu giriş turnikesinde okutun. Güvenlik için kod düzenli olarak yenilenir.",
    "card.qrError": "QR alınamadı",

    "history.header": "Giriş Geçmişi",
    "history.empty": "Henüz giriş kaydınız yok.",

    "profile.header": "Profil",
    "profile.tckn": "TCKN",
    "profile.phone": "Telefon",
    "profile.startDate": "Üyelik başlangıç",
    "profile.endDate": "Üyelik bitiş",
    "profile.status": "Durum",
    "profile.statusActive": "Aktif",
    "profile.statusExpired": "Süresi dolmuş",
    "profile.statusPassive": "Pasif",
    "profile.logout": "Çıkış Yap",

    "dir.in": "Giriş",
    "dir.out": "Çıkış",
    "res.granted": "Onaylandı",
    "res.denied": "Reddedildi",

    "reason.MEMBERSHIP_EXPIRED": "Üyelik süresi dolmuş",
    "reason.MEMBERSHIP_SUSPENDED": "Üyelik askıya alınmış",
    "reason.MEMBERSHIP_PASSIVE": "Üyelik pasif",
    "reason.MEMBERSHIP_ARCHIVED": "Üyelik arşivlenmiş",
    "reason.MEMBERSHIP_INVALID": "Üyelik geçersiz",
    "reason.QR_EXPIRED": "QR kodunun süresi dolmuş",
    "reason.QR_BAD_FORMAT": "Geçersiz QR kodu",
    "reason.QR_BAD_SIGNATURE": "QR imzası geçersiz",
    "reason.MEMBER_NOT_FOUND": "Üye bulunamadı",
  },
} as const;

export type TKey = keyof (typeof dict)["en"];

type I18nState = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey) => string;
  tReason: (codeOrText: string | null | undefined) => string;
};

const I18nContext = createContext<I18nState | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    (async () => {
      const saved = (await SecureStore.getItemAsync(STORAGE_KEY)) as Lang | null;
      if (saved === "en" || saved === "tr") setLangState(saved);
    })();
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    SecureStore.setItemAsync(STORAGE_KEY, l).catch(() => {});
  }, []);

  const t = useCallback(
    (key: TKey) => dict[lang][key] ?? dict.en[key] ?? key,
    [lang]
  );

  const tReason = useCallback(
    (codeOrText: string | null | undefined) => {
      if (!codeOrText) return "";
      const key = `reason.${codeOrText}` as TKey;
      return dict[lang][key] ?? codeOrText;
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
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
