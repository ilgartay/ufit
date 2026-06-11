import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { colors } from "@/lib/theme";

function fmt(iso?: string) {
  return iso ? new Date(iso).toLocaleDateString() : "—";
}

export default function ProfileScreen() {
  const { member, logout } = useAuth();
  const { t } = useI18n();

  const statusText = member?.active
    ? t("profile.statusActive")
    : member?.expired
    ? t("profile.statusExpired")
    : t("profile.statusPassive");

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>{t("profile.header")}</Text>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {member?.fullName?.charAt(0)?.toUpperCase() ?? "U"}
          </Text>
        </View>
        <Text style={styles.name}>{member?.fullName}</Text>

        <View style={styles.card}>
          <Row label={t("profile.tckn")} value={member?.tckn} mono />
          <Row label={t("profile.phone")} value={member?.phone} />
          <Row label={t("profile.startDate")} value={fmt(member?.membershipStart)} />
          <Row label={t("profile.endDate")} value={fmt(member?.membershipEnd)} />
          <Row label={t("profile.status")} value={statusText} />
        </View>

        <TouchableOpacity style={styles.logout} onPress={logout}>
          <Text style={styles.logoutText}>{t("profile.logout")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string;
  mono?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, mono && styles.mono]}>{value ?? "—"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 24, alignItems: "center" },
  header: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: { color: "#fff", fontSize: 32, fontWeight: "700" },
  name: { fontSize: 20, fontWeight: "600", color: colors.text, marginBottom: 24 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 8, width: "100%" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e2e8f0",
  },
  rowLabel: { color: colors.subtext, fontSize: 14 },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: "500" },
  mono: { fontFamily: "Courier", letterSpacing: 1 },
  logout: {
    marginTop: 28,
    borderWidth: 1,
    borderColor: "#fca5a5",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  logoutText: { color: colors.danger, fontWeight: "600", fontSize: 15 },
});
