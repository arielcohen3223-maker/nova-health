import React, { useMemo, useState } from "react";
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../theme";
import { useLocale } from "../i18n/LocaleContext";
import { useAuth } from "../context/AuthContext";
import { useHealth } from "../context/HealthContext";
import { useSubscription } from "../context/SubscriptionContext";
import { config } from "../lib/config";
import { getSystemStatus, type FeatureStatus } from "../lib/system/status";
import type { Screen } from "../i18n/screens";

function RtlText({ children, style }: { children: React.ReactNode; style?: any }) {
  const { isRtl } = useLocale();
  return <Text style={[isRtl ? styles.rtl : styles.ltr, style]}>{children}</Text>;
}

function statusLabel(status: FeatureStatus, t: ReturnType<typeof useLocale>["t"]) {
  switch (status) {
    case "live":
      return t.settings.statusLive;
    case "demo":
      return t.settings.statusDemo;
    case "native_only":
      return t.settings.statusNative;
    default:
      return t.settings.statusSetup;
  }
}

export function SettingsScreen({ go }: { go: (s: Screen) => void }) {
  const { t } = useLocale();
  const { profile, signOut, requiresAuth, isDemo } = useAuth();
  const { healthKitAvailable, healthConnectAvailable, healthConnected, connectHealth, refresh, loading } = useHealth();
  const { tier, configured, purchase, restore, loading: subLoading } = useSubscription();
  const [busy, setBusy] = useState(false);
  const system = useMemo(() => getSystemStatus(), []);
  const healthAvailable = healthKitAvailable || healthConnectAvailable;
  const healthTitle = Platform.OS === "android" ? t.settings.healthConnect : t.settings.healthKit;
  const healthPrompt = healthConnected
    ? Platform.OS === "android"
      ? t.settings.healthConnectConnected
      : t.settings.healthConnected
    : Platform.OS === "android"
      ? t.settings.healthConnectPrompt
      : t.settings.healthPrompt;
  const connectLabel = healthConnected
    ? t.settings.connected
    : Platform.OS === "android"
      ? t.settings.connectHealthConnect
      : t.settings.connect;

  const statusRows: { key: keyof typeof t.settings.statusFeatures; value: FeatureStatus }[] = [
    { key: "auth", value: system.auth },
    { key: "database", value: system.database },
    { key: "aiChat", value: system.aiChat },
    { key: "mealVision", value: system.mealVision },
    { key: "healthWatch", value: system.healthWatch },
    { key: "bloodPdf", value: system.bloodPdf },
    { key: "subscriptions", value: system.subscriptions },
  ];

  const onConnect = async () => {
    setBusy(true);
    await connectHealth();
    setBusy(false);
  };

  return (
    <ScrollView style={styles.pad} contentContainerStyle={{ gap: 14, paddingBottom: 40 }}>
      <RtlText style={styles.title}>{t.settings.title}</RtlText>

      <View style={styles.card}>
        <RtlText style={styles.cardTitle}>{t.settings.account}</RtlText>
        <RtlText style={styles.muted}>{profile?.display_name ?? t.settings.guest}</RtlText>
        {isDemo && <RtlText style={styles.demoBadge}>{t.settings.demoMode}</RtlText>}
        {requiresAuth && (
          <Pressable onPress={signOut} style={styles.dangerBtn}>
            <RtlText style={styles.dangerText}>{t.signOut}</RtlText>
          </Pressable>
        )}
      </View>

      {healthAvailable && (
        <View style={styles.card}>
          <RtlText style={styles.cardTitle}>{healthTitle}</RtlText>
          <RtlText style={styles.muted}>{healthPrompt}</RtlText>
          <Pressable onPress={onConnect} disabled={busy || healthConnected} style={styles.primaryBtn}>
            {busy ? (
              <ActivityIndicator color={theme.onPrimary} />
            ) : (
              <RtlText style={styles.primaryText}>{connectLabel}</RtlText>
            )}
          </Pressable>
          <Pressable onPress={refresh} style={styles.linkBtn}>
            <RtlText style={styles.linkText}>{t.settings.syncNow}</RtlText>
          </Pressable>
          {loading && <ActivityIndicator color={theme.primary} />}
        </View>
      )}

      <View style={styles.card}>
        <RtlText style={styles.cardTitle}>{t.settings.systemStatus}</RtlText>
        <RtlText style={styles.muted}>
          {system.supabaseConfigured ? t.settings.supabaseOn : t.settings.supabaseOff} · {system.platform}
        </RtlText>
        {statusRows.map(row => (
          <View key={row.key} style={styles.statusRow}>
            <RtlText style={styles.statusFeature}>{t.settings.statusFeatures[row.key]}</RtlText>
            <RtlText style={styles.statusPill}>{statusLabel(row.value, t)}</RtlText>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <RtlText style={styles.cardTitle}>{t.settings.subscription}</RtlText>
        <RtlText style={styles.muted}>
          {tier === "pro" ? t.settings.proActive : t.settings.freePlan}
        </RtlText>
        {configured && tier !== "pro" && (
          <Pressable
            onPress={async () => {
              setBusy(true);
              await purchase();
              setBusy(false);
            }}
            disabled={subLoading || busy}
            style={styles.primaryBtn}
          >
            <RtlText style={styles.primaryText}>{t.settings.upgradePro}</RtlText>
          </Pressable>
        )}
        {configured && (
          <Pressable onPress={restore} style={styles.linkBtn}>
            <RtlText style={styles.linkText}>{t.settings.restore}</RtlText>
          </Pressable>
        )}
      </View>

      <Pressable onPress={() => Linking.openURL(config.privacyUrl)} style={styles.row}>
        <Ionicons name="document-text-outline" size={20} color={theme.primary} />
        <RtlText style={styles.rowText}>{t.settings.privacy}</RtlText>
        <Ionicons name="chevron-back" size={18} color={theme.muted} />
      </Pressable>
      <Pressable onPress={() => Linking.openURL(config.termsUrl)} style={styles.row}>
        <Ionicons name="reader-outline" size={20} color={theme.primary} />
        <RtlText style={styles.rowText}>{t.settings.terms}</RtlText>
        <Ionicons name="chevron-back" size={18} color={theme.muted} />
      </Pressable>
    </ScrollView>
  );
}

export function PrivacyScreen({ go }: { go: (s: Screen) => void }) {
  const { t } = useLocale();
  const p = t.privacy;

  return (
    <ScrollView style={styles.pad} contentContainerStyle={{ gap: 12, paddingBottom: 40 }}>
      <Pressable onPress={() => go("settings")} style={styles.back}>
        <Ionicons name="arrow-forward" size={20} color={theme.primary} />
        <RtlText style={styles.linkText}>{t.settings.title}</RtlText>
      </Pressable>
      <RtlText style={styles.title}>{p.title}</RtlText>
      <RtlText style={styles.updated}>{p.updated}</RtlText>
      {p.sections.map((section) => (
        <View key={section.title} style={styles.card}>
          <RtlText style={styles.cardTitle}>{section.title}</RtlText>
          <RtlText style={styles.body}>{section.body}</RtlText>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  title: { fontSize: 26, fontWeight: "800", color: theme.ink },
  card: {
    backgroundColor: theme.card,
    borderRadius: 18,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardTitle: { fontSize: 17, fontWeight: "800", color: theme.ink },
  muted: { fontSize: 14, color: theme.muted },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: theme.primary,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryText: { color: theme.onPrimary, fontWeight: "800" },
  dangerBtn: { marginTop: 8, paddingVertical: 8 },
  dangerText: { color: theme.danger, fontWeight: "700" },
  linkBtn: { paddingVertical: 6, alignItems: "center" },
  linkText: { color: theme.primary, fontWeight: "700" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: theme.card,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  rowText: { flex: 1, fontWeight: "700", color: theme.ink },
  back: { flexDirection: "row", alignItems: "center", gap: 6 },
  updated: { color: theme.muted, fontSize: 12 },
  body: { color: theme.ink, fontSize: 14, lineHeight: 22 },
  demoBadge: { fontSize: 12, color: theme.info, fontWeight: "700", marginTop: 4 },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  statusFeature: { fontSize: 14, color: theme.ink, fontWeight: "600", flex: 1 },
  statusPill: { fontSize: 12, color: theme.primary, fontWeight: "700" },
  rtl: { writingDirection: "rtl", textAlign: "right", color: theme.ink },
  ltr: { writingDirection: "ltr", textAlign: "left", color: theme.ink },
});
