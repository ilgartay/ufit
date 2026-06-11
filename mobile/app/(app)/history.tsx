import { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { colors } from "@/lib/theme";

type Entry = {
  id: string;
  timestamp: string;
  direction: "IN" | "OUT";
  result: "GRANTED" | "DENIED";
  reason: string | null;
};

export default function HistoryScreen() {
  const { t, tReason } = useI18n();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api<{ entries: Entry[] }>("/me/entries");
      setEntries(res.entries);
    } catch {
      /* yoksay */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Text style={styles.header}>{t("history.header")}</Text>
      <FlatList
        data={entries}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={<Text style={styles.empty}>{t("history.empty")}</Text>}
        renderItem={({ item }) => {
          const granted = item.result === "GRANTED";
          const d = new Date(item.timestamp);
          return (
            <View style={styles.row}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: granted ? colors.success : "#ef4444" },
                ]}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>
                  {item.direction === "IN" ? t("dir.in") : t("dir.out")} ·{" "}
                  {granted ? t("res.granted") : t("res.denied")}
                </Text>
                <Text style={styles.rowDate}>
                  {d.toLocaleDateString()}{" "}
                  {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
                {item.reason ? (
                  <Text style={styles.rowReason}>{tReason(item.reason)}</Text>
                ) : null}
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  empty: { textAlign: "center", color: colors.muted, marginTop: 40 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  rowTitle: { fontSize: 15, fontWeight: "600", color: "#334155" },
  rowDate: { fontSize: 13, color: colors.subtext, marginTop: 2 },
  rowReason: { fontSize: 13, color: "#ef4444", marginTop: 2 },
});
