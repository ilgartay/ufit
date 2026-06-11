import { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { colors } from "@/lib/theme";
import LanguageSwitcher from "@/components/LanguageSwitcher";

type QrResp = {
  token: string;
  expiresAt: number;
  ttl: number;
  membershipActive: boolean;
  daysLeft: number;
};

const REFRESH_BEFORE = 10;

export default function CardScreen() {
  const { member, refresh } = useAuth();
  const { t } = useI18n();
  const [qr, setQr] = useState<QrResp | null>(null);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchQr = useCallback(async () => {
    try {
      const res = await api<QrResp>("/me/qr");
      setQr(res);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("card.qrError"));
    }
  }, [t]);

  useEffect(() => {
    fetchQr();
    timerRef.current = setInterval(() => {
      setQr((cur) => {
        if (!cur) return cur;
        const left = cur.expiresAt - Math.floor(Date.now() / 1000);
        setCountdown(Math.max(0, left));
        if (left <= REFRESH_BEFORE) {
          fetchQr();
        }
        return cur;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchQr]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refresh(), fetchQr()]);
    setRefreshing(false);
  }, [refresh, fetchQr]);

  const active = member?.active;
  const statusText = active
    ? `${t("card.statusActive")} · ${member?.daysLeft} ${t("card.daysLeft")}`
    : member?.expired
    ? t("card.statusExpired")
    : t("card.statusPassive");

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.topRow}>
          <View>
            <Text style={styles.greeting}>{t("card.greeting")}</Text>
            <Text style={styles.name}>{member?.fullName ?? t("card.member")}</Text>
          </View>
          <LanguageSwitcher />
        </View>

        <View
          style={[
            styles.statusPill,
            { backgroundColor: active ? "#dcfce7" : "#fee2e2" },
          ]}
        >
          <Text style={{ color: active ? "#15803d" : "#b91c1c", fontWeight: "600" }}>
            {statusText}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("card.qrTitle")}</Text>
          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : !qr ? (
            <View style={styles.qrPlaceholder}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <View style={styles.qrWrap}>
              <QRCode value={qr.token} size={220} />
            </View>
          )}
          <Text style={styles.countdown}>
            {qr ? `${t("card.countdown")} ${countdown} ${t("card.seconds")}` : " "}
          </Text>
          <Text style={styles.cardHint}>{t("card.hint")}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 24, alignItems: "center" },
  topRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greeting: { fontSize: 16, color: colors.subtext },
  name: { fontSize: 26, fontWeight: "700", color: colors.text, marginBottom: 12 },
  statusPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 24,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 16,
  },
  qrWrap: { padding: 12, backgroundColor: colors.white, borderRadius: 12 },
  qrPlaceholder: {
    width: 244,
    height: 244,
    justifyContent: "center",
    alignItems: "center",
  },
  countdown: {
    marginTop: 14,
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },
  cardHint: { marginTop: 8, fontSize: 13, color: colors.muted, textAlign: "center" },
  error: { color: colors.danger, paddingVertical: 40 },
});
