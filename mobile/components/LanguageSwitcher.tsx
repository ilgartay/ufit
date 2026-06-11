import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useI18n, Lang } from "@/lib/i18n";
import { colors } from "@/lib/theme";

const OPTIONS: { lang: Lang; flag: string; label: string }[] = [
  { lang: "en", flag: "🇬🇧", label: "EN" },
  { lang: "tr", flag: "🇹🇷", label: "TR" },
];

export default function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <View style={styles.wrap}>
      {OPTIONS.map((o) => {
        const active = lang === o.lang;
        return (
          <TouchableOpacity
            key={o.lang}
            onPress={() => setLang(o.lang)}
            style={[styles.btn, active && styles.btnActive]}
          >
            <Text style={styles.flag}>{o.flag}</Text>
            <Text style={[styles.label, active && styles.labelActive]}>
              {o.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: colors.white,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 3,
    gap: 2,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  btnActive: { backgroundColor: "#e0f2fe" },
  flag: { fontSize: 15 },
  label: { fontSize: 12, fontWeight: "600", color: colors.muted },
  labelActive: { color: colors.primaryDark },
});
