import { Tabs } from "expo-router";
import { Text } from "react-native";
import { useI18n } from "@/lib/i18n";
import { colors } from "@/lib/theme";

function icon(emoji: string) {
  // eslint-disable-next-line react/display-name
  return ({ color }: { color: string }) => (
    <Text style={{ fontSize: 20, color }}>{emoji}</Text>
  );
}

export default function AppTabsLayout() {
  const { t } = useI18n();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t("tab.card"), tabBarIcon: icon("🎟️") }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: t("tab.history"), tabBarIcon: icon("🕘") }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t("tab.profile"), tabBarIcon: icon("👤") }}
      />
    </Tabs>
  );
}
