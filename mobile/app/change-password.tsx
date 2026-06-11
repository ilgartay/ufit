import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { colors } from "@/lib/theme";

export default function ChangePasswordScreen() {
  const { setMustChangePassword, refresh } = useAuth();
  const { t } = useI18n();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError("");
    if (next.length < 6) {
      setError(t("cpw.errMin"));
      return;
    }
    if (next !== confirm) {
      setError(t("cpw.errMatch"));
      return;
    }
    setLoading(true);
    try {
      await api("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      setMustChangePassword(false);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>{t("cpw.title")}</Text>
        <Text style={styles.subtitle}>{t("cpw.subtitle")}</Text>

        <Field label={t("cpw.current")}>
          <TextInput
            style={styles.input}
            value={current}
            onChangeText={setCurrent}
            secureTextEntry
          />
        </Field>
        <Field label={t("cpw.new")}>
          <TextInput
            style={styles.input}
            value={next}
            onChangeText={setNext}
            secureTextEntry
          />
        </Field>
        <Field label={t("cpw.confirm")}>
          <TextInput
            style={styles.input}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
          />
        </Field>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t("cpw.save")}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: colors.subtext,
    textAlign: "center",
    marginBottom: 24,
    marginTop: 4,
  },
  field: { marginBottom: 16 },
  label: { fontSize: 14, color: "#475569", marginBottom: 6 },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  error: { color: colors.danger, marginBottom: 12 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
