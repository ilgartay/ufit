import { Text, StyleSheet } from "react-native";
import { colors } from "@/lib/theme";

export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <Text style={[styles.logo, { fontSize: size }]}>
      <Text style={{ color: colors.text }}>u</Text>
      <Text style={{ color: colors.primary }}>FIT</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  logo: {
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -1,
  },
});
