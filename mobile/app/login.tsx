import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { colors } from "@/lib/theme";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function LoginScreen() {
  const { login } = useAuth();
  const { t } = useI18n();
  const [tckn, setTckn] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError("");
    if (tckn.length !== 11) {
      setError(t("login.tcknLen"));
      return;
    }
    setLoading(true);
    try {
      await login(tckn, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("login.fail"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <View style={{ marginBottom: 16 }}>
          <LanguageSwitcher />
        </View>
        <Logo size={48} />
        <Text style={styles.subtitle}>{t("login.subtitle")}</Text>

        <View style={styles.field}>
          <Text style={styles.label}>{t("login.tckn")}</Text>
          <TextInput
            style={styles.input}
            value={tckn}
            onChangeText={(v) => setTckn(v.replace(/\D/g, "").slice(0, 11))}
            keyboardType="number-pad"
            placeholder={t("login.tcknPlaceholder")}
            maxLength={11}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t("login.password")}</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder={t("login.passwordPlaceholder")}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t("login.submit")}</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>{t("login.hint")}</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    color: colors.subtext,
    marginTop: 6,
    marginBottom: 28,
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
  hint: { textAlign: "center", color: colors.muted, fontSize: 13, marginTop: 20 },
});
