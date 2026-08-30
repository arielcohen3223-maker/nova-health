import React, { useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../theme";
import { useLocale } from "../i18n/LocaleContext";
import { useAuth } from "../context/AuthContext";
import { useHealth } from "../context/HealthContext";
import { useSubscription } from "../context/SubscriptionContext";
import { config } from "../lib/config";
import type { Screen } from "../i18n/screens";

function RtlText({ children, style }: { children: React.ReactNode; style?: any }) {
  const { isRtl } = useLocale();
  return <Text style={[isRtl ? styles.rtl : styles.ltr, style]}>{children}</Text>;
}

export function SettingsScreen({ go }: { go: (s: Screen) => void }) {
  const { t } = useLocale();
  const { profile, signOut, requiresAuth } = useAuth();
  const { healthKitAvailable, healthConnected, connectHealth, refresh, loading } = useHealth();
  const { tier, configured, purchase, restore, loading: subLoading } = useSubscription();
  const [busy, setBusy] = useState(false);

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
        {requiresAuth && (
          <Pressable onPress={signOut} style={styles.dangerBtn}>
            <RtlText style={styles.dangerText}>{t.signOut}</RtlText>
          </Pressable>
        )}
      </View>

      {healthKitAvailable && (
        <View style={styles.card}>
          <RtlText style={styles.cardTitle}>{t.settings.healthKit}</RtlText>
          <RtlText style={styles.muted}>
            {healthConnected ? t.settings.healthConnected : t.settings.healthPrompt}
          </RtlText>
          <Pressable onPress={onConnect} disabled={busy || healthConnected} style={styles.primaryBtn}>
            {busy ? (
              <ActivityIndicator color={theme.onPrimary} />
            ) : (
              <RtlText style={styles.primaryText}>
                {healthConnected ? t.settings.connected : t.settings.connect}
              </RtlText>
            )}
          </Pressable>
          <Pressable onPress={refresh} style={styles.linkBtn}>
            <RtlText style={styles.linkText}>{t.settings.syncNow}</RtlText>
          </Pressable>
          {loading && <ActivityIndicator color={theme.primary} />}
        </View>
      )}

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
  rtl: { writingDirection: "rtl", textAlign: "right", color: theme.ink },
  ltr: { writingDirection: "ltr", textAlign: "left", color: theme.ink },
});
