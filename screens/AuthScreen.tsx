import React, { useState } from "react";
import {
  ActivityIndicator,
  I18nManager,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../theme";
import { useLocale } from "../i18n/LocaleContext";
import { useAuth } from "../context/AuthContext";

function RtlText({ children, style }: { children: React.ReactNode; style?: any }) {
  const { isRtl } = useLocale();
  return <Text style={[isRtl ? styles.rtl : styles.ltr, style]}>{children}</Text>;
}

export function AuthScreen() {
  const { t, isRtl, toggleLocale } = useLocale();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setInfo(null);
    if (!email.trim() || !password) {
      setError(t.auth.errors.required);
      return;
    }
    if (mode === "signUp" && password.length < 8) {
      setError(t.auth.errors.passwordShort);
      return;
    }
    setBusy(true);
    try {
      if (mode === "signIn") {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password, name.trim());
        setInfo(t.auth.checkEmail);
        setMode("signIn");
      }
    } catch (e: any) {
      setError(e?.message ?? t.auth.errors.generic);
    } finally {
      setBusy(false);
    }
  };

  return (
    <LinearGradient colors={[...theme.gradientWelcome]} style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <Pressable onPress={toggleLocale} style={styles.langButton}>
          <Text style={styles.langText}>{t.langToggle}</Text>
        </Pressable>

        <View style={styles.hero}>
          <View style={styles.logoMark}>
            <Ionicons name="pulse" color={theme.onPrimary} size={28} />
          </View>
          <Text style={styles.logo}>NOVA</Text>
          <RtlText style={styles.tagline}>{t.auth.tagline}</RtlText>
        </View>

        <View style={styles.card}>
          <RtlText style={styles.cardTitle}>{mode === "signIn" ? t.auth.signInTitle : t.auth.signUpTitle}</RtlText>
          <RtlText style={styles.cardSub}>{t.auth.subtitle}</RtlText>

          {mode === "signUp" && (
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t.auth.namePlaceholder}
              placeholderTextColor={theme.placeholder}
              style={[styles.input, isRtl && styles.inputRtl]}
              textAlign={isRtl ? "right" : "left"}
              autoCapitalize="words"
            />
          )}
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={t.auth.emailPlaceholder}
            placeholderTextColor={theme.placeholder}
            style={[styles.input, isRtl && styles.inputRtl]}
            textAlign={isRtl ? "right" : "left"}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={t.auth.passwordPlaceholder}
            placeholderTextColor={theme.placeholder}
            style={[styles.input, isRtl && styles.inputRtl]}
            textAlign={isRtl ? "right" : "left"}
            secureTextEntry
            autoCapitalize="none"
          />

          {error && <RtlText style={styles.error}>{error}</RtlText>}
          {info && <RtlText style={styles.info}>{info}</RtlText>}

          <Pressable
            onPress={submit}
            disabled={busy}
            style={({ pressed }) => [styles.primary, pressed && { opacity: 0.88 }, busy && { opacity: 0.7 }]}
          >
            {busy ? (
              <ActivityIndicator color={theme.onPrimary} />
            ) : (
              <>
                <Ionicons name={mode === "signIn" ? "log-in-outline" : "person-add-outline"} size={19} color={theme.onPrimary} />
                <Text style={styles.primaryText}>{mode === "signIn" ? t.auth.signIn : t.auth.signUp}</Text>
              </>
            )}
          </Pressable>

          <Pressable
            onPress={() => {
              setMode(mode === "signIn" ? "signUp" : "signIn");
              setError(null);
              setInfo(null);
            }}
            style={styles.switch}
          >
            <RtlText style={styles.switchText}>
              {mode === "signIn" ? t.auth.noAccount : t.auth.hasAccount}
            </RtlText>
          </Pressable>
        </View>

        <View style={styles.disclaimer}>
          <Ionicons name="shield-checkmark-outline" color={theme.primary} size={18} />
          <RtlText style={styles.disclaimerText}>{t.disclaimer}</RtlText>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 22, paddingBottom: 24, justifyContent: "space-between" },
  langButton: {
    alignSelf: "flex-start",
    marginTop: 8,
    minWidth: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 10,
  },
  langText: { fontWeight: "700", color: theme.primary, fontSize: 13 },
  hero: { alignItems: "center", gap: 8, marginTop: 12 },
  logoMark: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { fontSize: 34, fontWeight: "900", letterSpacing: 4, color: theme.ink },
  tagline: { fontSize: 16, color: theme.muted, textAlign: "center", maxWidth: 320 },
  card: {
    backgroundColor: theme.card,
    borderRadius: 22,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardTitle: { fontSize: 22, fontWeight: "800", color: theme.ink },
  cardSub: { fontSize: 14, color: theme.muted, marginBottom: 4 },
  input: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.bg,
    paddingHorizontal: 14,
    fontSize: 15,
    color: theme.ink,
  },
  inputRtl: { writingDirection: "rtl" },
  primary: {
    marginTop: 4,
    height: 52,
    borderRadius: 16,
    backgroundColor: theme.primary,
    flexDirection: I18nManager.isRTL ? "row" : "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryText: { color: theme.onPrimary, fontWeight: "800", fontSize: 16 },
  switch: { alignItems: "center", paddingVertical: 6 },
  switchText: { color: theme.primary, fontWeight: "700", fontSize: 14 },
  error: { color: theme.danger, fontSize: 13 },
  info: { color: theme.info, fontSize: 13 },
  disclaimer: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center" },
  disclaimerText: { color: theme.muted, fontSize: 12, flexShrink: 1, textAlign: "center" },
  rtl: { writingDirection: "rtl", textAlign: "right", color: theme.ink },
  ltr: { writingDirection: "ltr", textAlign: "left", color: theme.ink },
});
