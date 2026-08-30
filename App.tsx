import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  ActivityIndicator,
  Dimensions,
  I18nManager,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from "react-native-svg";
import { theme } from "./theme";
import { LocaleProvider, useLocale } from "./i18n/LocaleContext";
import { allScreens, screenIcons, type Screen } from "./i18n/screens";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AuthScreen } from "./screens/AuthScreen";
import { HealthProvider, useHealth } from "./context/HealthContext";
import { SubscriptionProvider } from "./context/SubscriptionContext";
import { SettingsScreen, PrivacyScreen } from "./screens/SettingsScreen";
import { formatSleep, formatSteps } from "./lib/health/metrics";
import { askNova, analyzeMealImage, saveMealLog } from "./lib/ai/novaAi";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

I18nManager.allowRTL(true);

/** Semantic alias — all UI reads from theme.ts */
const C = {
  ink: theme.ink,
  muted: theme.muted,
  bg: theme.bg,
  card: theme.card,
  green: theme.primary,
  mint: theme.primaryLight,
  lime: theme.aiAccent,
  ai: theme.ai,
  orange: theme.warning,
  peach: theme.warningBg,
  red: theme.danger,
  blue: theme.info,
  border: theme.border,
  infoBg: theme.infoBg,
};

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function RtlText({ children, style, numberOfLines }: any) {
  const { isRtl } = useLocale();
  return (
    <Text numberOfLines={numberOfLines} style={[isRtl ? styles.rtl : styles.ltr, style]}>
      {children}
    </Text>
  );
}

function IconBubble({
  name,
  tone = "green",
  size = 42,
}: {
  name: IconName;
  tone?: "green" | "orange" | "blue" | "red";
  size?: number;
}) {
  const map = {
    green: [C.mint, C.green],
    orange: [C.peach, C.orange],
    blue: [C.infoBg, C.blue],
    red: [C.red + "18", C.red],
  };
  return (
    <View style={[styles.iconBubble, { width: size, height: size, borderRadius: size / 2, backgroundColor: map[tone][0] }]}>
      <Ionicons name={name} size={size * 0.48} color={map[tone][1]} />
    </View>
  );
}

function Pill({ text, tone = "green" }: { text: string; tone?: "green" | "orange" | "gray" | "red" }) {
  const colors = {
    green: [C.mint, C.green],
    orange: [C.peach, theme.pillOrangeText],
    gray: [theme.grayPillBg, C.muted],
    red: [theme.dangerBg, C.red],
  };
  return (
    <View style={[styles.pill, { backgroundColor: colors[tone][0] }]}>
      <RtlText style={[styles.pillText, { color: colors[tone][1] }]}>{text}</RtlText>
    </View>
  );
}

function Card({ children, style }: any) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function PrimaryButton({
  title,
  onPress,
  light = false,
  icon = "arrow-back",
}: {
  title: string;
  onPress: () => void;
  light?: boolean;
  icon?: IconName;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.primaryButton, light && styles.lightButton, pressed && { opacity: 0.86 }]}>
      <Ionicons name={icon} size={19} color={light ? C.green : theme.onPrimary} />
      <RtlText style={[styles.buttonText, light && { color: C.green }]}>{title}</RtlText>
    </Pressable>
  );
}

function ScreenHeader({ title, eyebrow, right }: { title: string; eyebrow?: string; right?: React.ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        {eyebrow && <RtlText style={styles.eyebrow}>{eyebrow}</RtlText>}
        <RtlText style={styles.title}>{title}</RtlText>
      </View>
      {right}
    </View>
  );
}

function ScoreRing({ score, size = 148, label = "ציון הבריאות" }: { score: number; size?: number; label?: string }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={theme.ringTrack} strokeWidth="10" fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={C.green}
          strokeWidth="10"
          fill="none"
          strokeDasharray={`${(circumference * score) / 100} ${circumference}`}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={[styles.score, { fontSize: size * 0.27 }]}>{score}</Text>
      <RtlText style={styles.scoreLabel}>{label}</RtlText>
    </View>
  );
}

function MiniChart({ color = C.green, fill = theme.primaryMuted, down = false }: { color?: string; fill?: string; down?: boolean }) {
  const p = down ? "M0 18 C22 3 34 26 53 18 S80 29 112 30" : "M0 29 C20 22 26 27 43 18 S71 22 83 10 S101 14 112 4";
  const area = `${p} L112 42 L0 42 Z`;
  return (
    <Svg width="100%" height="44" viewBox="0 0 112 44">
      <Defs>
        <SvgGradient id={`g${down}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={fill} stopOpacity="1" />
          <Stop offset="1" stopColor={fill} stopOpacity="0.05" />
        </SvgGradient>
      </Defs>
      <Path d={area} fill={`url(#g${down})`} />
      <Path d={p} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function MetricCard({
  icon,
  label,
  value,
  unit,
  status,
  tone = "green",
  chartDown = false,
}: {
  icon: IconName;
  label: string;
  value: string;
  unit?: string;
  status: string;
  tone?: "green" | "orange" | "blue" | "red";
  chartDown?: boolean;
}) {
  return (
    <Card style={styles.metricCard}>
      <View style={styles.rowBetween}>
        <IconBubble name={icon} tone={tone} size={38} />
        <Pill text={status} tone={tone === "red" ? "red" : tone === "orange" ? "orange" : "green"} />
      </View>
      <RtlText style={styles.metricLabel}>{label}</RtlText>
      <View style={styles.valueRow}>
        <Text style={styles.metricValue}>{value}</Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
      <MiniChart down={chartDown} color={tone === "red" ? C.red : tone === "orange" ? C.orange : tone === "blue" ? C.blue : C.green} />
    </Card>
  );
}

function QuickAction({ icon, label, onPress, tone = "green" }: { icon: IconName; label: string; onPress: () => void; tone?: "green" | "orange" | "blue" }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quickAction, pressed && { opacity: 0.88 }]}>
      <IconBubble name={icon} tone={tone} size={44} />
      <RtlText style={styles.quickActionLabel}>{label}</RtlText>
    </Pressable>
  );
}

function Welcome({ go }: { go: (s: Screen) => void }) {
  const { t } = useLocale();
  const { connectHealth, healthKitAvailable, healthConnected } = useHealth();
  const watches = [
    ["logo-apple", "Apple Watch"],
    ["watch-outline", "Garmin"],
    ["phone-portrait-outline", "Galaxy Watch"],
    ["fitness-outline", "Fitbit"],
  ] as [IconName, string][];
  return (
    <LinearGradient colors={[...theme.gradientWelcome]} style={styles.full}>
      <View style={styles.welcomeTop}>
        <View style={styles.logoMark}>
          <Ionicons name="pulse" color={theme.onPrimary} size={28} />
        </View>
        <Text style={styles.logo}>NOVA</Text>
        <RtlText style={styles.tagline}>{t.welcome.tagline}</RtlText>
        <RtlText style={styles.welcomeCopy}>{t.welcome.copy}</RtlText>
      </View>
      <Card style={styles.watchCard}>
        <RtlText style={styles.cardTitle}>{t.welcome.connectTitle}</RtlText>
        <View style={styles.watchGrid}>
          {watches.map(([icon, name]) => (
            <View key={name} style={styles.watchItem}>
              <IconBubble name={icon} size={40} />
              <Text style={styles.watchName}>{name}</Text>
              <Ionicons name="checkmark-circle" color={C.green} size={17} />
            </View>
          ))}
        </View>
      </Card>
      <View style={styles.disclaimer}>
        <Ionicons name="shield-checkmark-outline" color={C.green} size={18} />
        <RtlText style={styles.disclaimerText}>{t.disclaimer}</RtlText>
      </View>
      {healthKitAvailable && !healthConnected && (
        <PrimaryButton title={t.settings.connect} onPress={() => connectHealth()} icon="heart-outline" light />
      )}
      <PrimaryButton title={t.welcome.start} onPress={() => go("learning")} />
    </LinearGradient>
  );
}

function Learning({ go }: { go: (s: Screen) => void }) {
  const { t } = useLocale();
  const { profile } = useAuth();
  const learningDays = profile?.learning_days ?? 12;
  const progressPct = Math.round((learningDays / 28) * 100);
  const m = t.learning.metrics;
  const metrics = [
    ["heart-outline", m.rhr],
    ["pulse-outline", m.hrv],
    ["moon-outline", m.sleep],
    ["walk-outline", m.activity],
    ["thermometer-outline", m.temp],
    ["flash-outline", m.stress],
  ] as [IconName, string][];
  return (
    <View style={styles.screenPad}>
      <View style={styles.learningArt}>
        <View style={styles.orbitLarge}>
          <View style={styles.orbitSmall}>
            <Ionicons name="sparkles" size={38} color={C.green} />
          </View>
        </View>
      </View>
      <RtlText style={[styles.title, { textAlign: "center" }]}>{t.learning.title}</RtlText>
      <RtlText style={styles.centerCopy}>{t.learning.copy}</RtlText>
      <Card>
        <View style={styles.rowBetween}>
          <Pill text={`${progressPct}%`} />
          <RtlText style={styles.cardTitle}>{learningDays}/28</RtlText>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>
        <View style={styles.metricList}>
          {metrics.map(([icon, label], i) => (
            <View key={label} style={styles.learningMetric}>
              <View style={styles.learningMetricLeft}>
                <Ionicons name={i < 4 ? "checkmark-circle" : "time-outline"} color={i < 4 ? C.green : C.muted} size={20} />
                <RtlText style={styles.listText}>{label}</RtlText>
              </View>
              <IconBubble name={icon} size={36} tone={i >= 4 ? "orange" : "green"} />
            </View>
          ))}
        </View>
      </Card>
      <PrimaryButton title={t.learning.showDashboard} onPress={() => go("home")} />
    </View>
  );
}

function Home({ go }: { go: (s: Screen) => void }) {
  const { t, locale } = useLocale();
  const { profile } = useAuth();
  const { metrics, score, recovery } = useHealth();
  const h = t.home;
  const name = profile?.display_name?.split(" ")[0] ?? (locale === "he" ? "נועה" : "Noa");
  const greeting = h.greeting.replace(/נועה|Noa/i, name);
  return (
    <View style={styles.screenPad}>
      <ScreenHeader title={greeting} eyebrow={h.date} right={<Pressable onPress={() => go("settings")}><IconBubble name="person-outline" /></Pressable>} />
      <LinearGradient colors={[C.green, theme.primaryDark]} style={styles.heroCard}>
        <View>
          <Pill text={h.statusExcellent} />
          <RtlText style={styles.heroTitle}>{h.bodyBalanced}</RtlText>
          <RtlText style={styles.heroCopy}>{h.allInRange}</RtlText>
        </View>
        <ScoreRing score={score} size={126} label={t.outOf100} />
      </LinearGradient>

      <View style={styles.quickRow}>
        <QuickAction icon="camera-outline" label={h.photoMeal} onPress={() => go("meal")} tone="orange" />
        <QuickAction icon="leaf-outline" label={h.breathing} onPress={() => go("breathing")} tone="green" />
        <QuickAction icon="chatbubble-ellipses-outline" label={h.askNova} onPress={() => go("chat")} tone="blue" />
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard icon="heart-outline" label={h.rhr} value={metrics.restingHr != null ? String(metrics.restingHr) : "—"} unit="BPM" status={h.normalForYou} />
        <MetricCard icon="pulse-outline" label="HRV" value={metrics.hrv != null ? String(metrics.hrv) : "—"} unit="ms" status={h.stable} tone="blue" />
        <MetricCard icon="moon-outline" label={h.sleep} value={formatSleep(metrics.sleepHours)} unit={h.hours} status={h.excellent} />
        <MetricCard icon="walk-outline" label={h.activity} value={formatSteps(metrics.steps)} unit={h.steps} status="82%" tone="orange" />
        <MetricCard icon="thermometer-outline" label={h.temp} value={metrics.bodyTemp != null ? String(metrics.bodyTemp) : "—"} unit="°C" status={h.ok} tone="green" />
        <MetricCard icon="flash-outline" label={h.stress} value={metrics.stressScore != null ? String(metrics.stressScore) : "—"} unit="/100" status={h.low} tone="blue" chartDown />
      </View>

      <Card style={styles.recoveryCard}>
        <IconBubble name="battery-charging-outline" />
        <View style={{ flex: 1 }}>
          <RtlText style={styles.metricLabel}>{h.recovery}</RtlText>
          <RtlText style={styles.cardTitle}>{h.recoveryHigh}</RtlText>
        </View>
        <Text style={styles.recoveryValue}>{recovery}%</Text>
      </Card>
      <PrimaryButton title={h.weeklyReport} onPress={() => go("report")} light />
    </View>
  );
}

function MealCapture({ go }: { go: (s: Screen) => void }) {
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const m = t.meal;
  const [step, setStep] = useState<"camera" | "result">("camera");
  const [meal, setMeal] = useState<{ dishName: string; calories: number; proteinG: number; fatG: number; carbsG: number; insight: string } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const pickAndAnalyze = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.6 });
    if (result.canceled || !result.assets[0]?.base64) return;
    setAnalyzing(true);
    try {
      const analysis = await analyzeMealImage(result.assets[0].base64, locale);
      setMeal(analysis);
      if (user?.id) await saveMealLog(user.id, analysis);
      setStep("result");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <View style={styles.screenPad}>
      <ScreenHeader title={m.title} eyebrow={m.eyebrow} right={<IconBubble name="camera-outline" tone="orange" />} />
      <Card style={styles.mealContext}>
        <Ionicons name="information-circle-outline" size={18} color={C.green} />
        <RtlText style={styles.mealContextText}>{m.contextNote}</RtlText>
      </Card>

      {step === "camera" ? (
        <>
          <Pressable onPress={pickAndAnalyze} style={styles.cameraFrame} disabled={analyzing}>
            <View style={styles.cameraInner}>
              {analyzing ? (
                <ActivityIndicator size="large" color={C.orange} />
              ) : (
                <>
                  <Ionicons name="camera" size={42} color={C.orange} />
                  <RtlText style={styles.cameraHint}>{m.tapPhoto}</RtlText>
                </>
              )}
            </View>
          </Pressable>
          <RtlText style={styles.sectionTitle}>{m.tipsTitle}</RtlText>
          <View style={styles.tipList}>
            {m.tips.map(tip => (
              <View key={tip} style={styles.tipRow}>
                <Ionicons name="checkmark-circle" size={16} color={C.green} />
                <RtlText style={styles.tipText}>{tip}</RtlText>
              </View>
            ))}
          </View>
        </>
      ) : (
        <>
          <Card style={styles.mealResult}>
            <View style={styles.mealPhotoPlaceholder}>
              <Ionicons name="restaurant-outline" size={36} color={C.orange} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <RtlText style={styles.cardTitle}>{meal?.dishName ?? m.dishName}</RtlText>
              <Pill text={m.aiAnalysis} tone="orange" />
              <View style={styles.macroRow}>
                <View style={styles.macro}><Text style={styles.macroVal}>{meal?.calories ?? 420}</Text><RtlText style={styles.macroLbl}>{m.kcal}</RtlText></View>
                <View style={styles.macro}><Text style={styles.macroVal}>{meal?.proteinG ?? 18}g</Text><RtlText style={styles.macroLbl}>{m.protein}</RtlText></View>
                <View style={styles.macro}><Text style={styles.macroVal}>{meal?.fatG ?? 32}g</Text><RtlText style={styles.macroLbl}>{m.fat}</RtlText></View>
                <View style={styles.macro}><Text style={styles.macroVal}>{meal?.carbsG ?? 24}g</Text><RtlText style={styles.macroLbl}>{m.carbs}</RtlText></View>
              </View>
            </View>
          </Card>
          <Card style={styles.insightCard}>
            <View style={styles.insightTop}>
              <IconBubble name="sparkles-outline" />
              <View style={{ flex: 1 }}>
                <RtlText style={styles.eyebrow}>{m.bodyLink}</RtlText>
                <RtlText style={styles.cardTitle}>{m.addedContext}</RtlText>
              </View>
            </View>
            <RtlText style={styles.insightText}>{meal?.insight ?? m.insight}</RtlText>
          </Card>
          <PrimaryButton title={m.backHome} onPress={() => go("home")} icon="checkmark" />
          <Pressable onPress={() => { setStep("camera"); setMeal(null); }} style={styles.linkBtn}>
            <RtlText style={styles.linkText}>{m.another}</RtlText>
          </Pressable>
        </>
      )}
    </View>
  );
}

function BreathingExercise({ go }: { go: (s: Screen) => void }) {
  const { t } = useLocale();
  const b = t.breathing;
  const scale = useRef(new Animated.Value(1)).current;
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");
  const [seconds, setSeconds] = useState(180);
  const [running, setRunning] = useState(false);

  const phaseLabel = { in: b.inhale, hold: b.hold, out: b.exhale }[phase];

  useEffect(() => {
    if (!running) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.35, duration: 4000, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.35, duration: 2000, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 4000, useNativeDriver: true }),
      ])
    );
    loop.start();
    const phaseTimer = setInterval(() => {
      setPhase(p => (p === "in" ? "hold" : p === "hold" ? "out" : "in"));
    }, 4000);
    const countdown = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => {
      loop.stop();
      clearInterval(phaseTimer);
      clearInterval(countdown);
    };
  }, [running, scale]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <View style={[styles.screenPad, styles.breathingPad]}>
      <ScreenHeader title={b.title} eyebrow={b.eyebrow} right={<IconBubble name="leaf-outline" />} />
      <Card style={styles.stressCard}>
        <View style={styles.rowBetween}>
          <Pill text={b.stressMedium} tone="orange" />
          <IconBubble name="flash-outline" tone="orange" size={40} />
        </View>
        <RtlText style={styles.mutedText}>{b.stressNote}</RtlText>
      </Card>

      <View style={styles.breatheCenter}>
        <Animated.View style={[styles.breatheRing, { transform: [{ scale }] }]}>
          <View style={styles.breatheInner}>
            <RtlText style={styles.breathePhase}>{running ? phaseLabel : b.ready}</RtlText>
            <Text style={styles.breatheTimer}>{`${mins}:${secs.toString().padStart(2, "0")}`}</Text>
          </View>
        </Animated.View>
      </View>

      <View style={styles.breatheSteps}>
        {[
          ["1", b.step1],
          ["2", b.step2],
          ["3", b.step3],
        ].map(([n, stepText]) => (
          <View key={n} style={styles.breatheStep}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>{n}</Text></View>
            <RtlText style={styles.listText}>{stepText}</RtlText>
          </View>
        ))}
      </View>

      {!running ? (
        <PrimaryButton title={b.start} onPress={() => setRunning(true)} icon="play" />
      ) : (
        <PrimaryButton title={b.finish} onPress={() => go("home")} light icon="checkmark" />
      )}
    </View>
  );
}

function Changes({ go }: { go: (s: Screen) => void }) {
  const { t } = useLocale();
  const c = t.changes;
  const f = c.factors;
  const factors = [
    ["wine-outline", f.alcohol, false],
    ["sunny-outline", f.heat, false],
    ["airplane-outline", f.flight, false],
    ["moon-outline", f.shortSleep, true],
    ["barbell-outline", f.hardWorkout, true],
    ["restaurant-outline", f.heavyMeal, true],
    ["flash-outline", f.stress, false],
  ] as [IconName, string, boolean][];
  return (
    <View style={styles.screenPad}>
      <ScreenHeader title={c.title} eyebrow={c.eyebrow} right={<IconBubble name="analytics-outline" />} />
      <Card style={styles.changeHero}>
        <View style={styles.rowBetween}>
          <Pill text="+11%" tone="orange" />
          <IconBubble name="heart-outline" tone="red" />
        </View>
        <RtlText style={styles.metricLabel}>{c.rhr}</RtlText>
        <View style={styles.valueRow}>
          <Text style={styles.bigValue}>64</Text>
          <Text style={styles.unit}>BPM</Text>
        </View>
        <RtlText style={styles.mutedText}>{c.vsBaseline}</RtlText>
        <MiniChart color={C.orange} fill={C.peach} />
      </Card>
      <RtlText style={styles.sectionTitle}>{c.contextTitle}</RtlText>
      <View style={styles.factorGrid}>
        {factors.map(([icon, label, active]) => (
          <Pressable key={label} onPress={() => label === f.heavyMeal && go("meal")} style={[styles.factor, active && styles.factorActive]}>
            <Ionicons name={icon} size={21} color={active ? C.green : C.muted} />
            <RtlText style={[styles.factorText, active && { color: C.green }]}>{label}</RtlText>
            {active && <Ionicons name="checkmark-circle" size={16} color={C.green} />}
          </Pressable>
        ))}
      </View>
      <Card style={styles.insightCard}>
        <View style={styles.insightTop}>
          <IconBubble name="sparkles-outline" />
          <View style={{ flex: 1 }}>
            <RtlText style={styles.eyebrow}>{c.novaExplain}</RtlText>
            <RtlText style={styles.cardTitle}>{c.noAlert}</RtlText>
          </View>
        </View>
        <RtlText style={styles.insightText}>{c.explainText}</RtlText>
      </Card>
      <Pressable onPress={() => go("breathing")} style={styles.breatheCta}>
        <IconBubble name="leaf-outline" size={36} />
        <View style={{ flex: 1 }}>
          <RtlText style={styles.cardTitle}>{t.breathing.ctaTitle}</RtlText>
          <RtlText style={styles.mutedText}>{t.breathing.ctaSub}</RtlText>
        </View>
        <Ionicons name="chevron-back" color={C.muted} size={18} />
      </Pressable>
      <LinearGradient colors={[...theme.gradientProtection]} style={styles.protection}>
        <View>
          <RtlText style={styles.cardTitle}>{c.protectionTitle}</RtlText>
          <RtlText style={styles.mutedText}>{c.protectionSub}</RtlText>
        </View>
        <Text style={styles.protectionValue}>97%</Text>
      </LinearGradient>
    </View>
  );
}

function Alert({ go }: { go: (s: Screen) => void }) {
  const { t } = useLocale();
  const a = t.alert;
  const h = t.home;
  const metrics = [
    ["heart-outline", h.rhr, "+13%", C.red],
    ["pulse-outline", "HRV", "−19%", C.orange],
    ["thermometer-outline", h.temp, "+0.3°", C.orange],
    ["flash-outline", h.stress, "+22%", C.orange],
  ] as [IconName, string, string, string][];
  return (
    <View style={styles.screenPad}>
      <View style={styles.alertBanner}>
        <IconBubble name="notifications" tone="orange" size={52} />
        <Pill text={a.daysPill} tone="orange" />
      </View>
      <RtlText style={styles.title}>{a.title}</RtlText>
      <RtlText style={styles.alertLead}>{a.lead}</RtlText>
      <Card style={{ gap: 4 }}>
        {metrics.map(([icon, label, value, color]) => (
          <View key={label} style={styles.alertMetric}>
            <IconBubble name={icon} tone={color === C.red ? "red" : "orange"} />
            <RtlText style={[styles.listText, { flex: 1 }]}>{label}</RtlText>
            <Text style={[styles.alertValue, { color }]}>{value}</Text>
          </View>
        ))}
      </Card>
      <RtlText style={styles.sectionTitle}>{a.actionsTitle}</RtlText>
      {(
        [
          ["leaf-outline", a.breathe, a.breatheSub, "breathing"],
          ["water-outline", a.water, a.waterSub, null],
          ["moon-outline", a.sleep, a.sleepSub, null],
        ] as [IconName, string, string, Screen | null][]
      ).map(([icon, title, sub, target]) => (
        <Card key={title as string} style={styles.recommendation}>
          <Pressable onPress={() => target && go(target)} style={styles.recommendationInner}>
            <IconBubble name={icon} />
            <View style={{ flex: 1 }}>
              <RtlText style={styles.cardTitle}>{title}</RtlText>
              <RtlText style={styles.mutedText}>{sub}</RtlText>
            </View>
            <Ionicons name="chevron-back" color={C.muted} size={18} />
          </Pressable>
        </Card>
      ))}
      <View style={styles.medicalNote}>
        <Ionicons name="information-circle-outline" color={C.muted} size={19} />
        <RtlText style={styles.disclaimerText}>{a.medical}</RtlText>
      </View>
    </View>
  );
}

function Report() {
  const { t } = useLocale();
  const r = t.report;
  const sections = [
    ["moon-outline", r.sections.sleep, r.status.improved, "+8%", "green"],
    ["heart-outline", r.sections.heart, r.status.stable, "0%", "blue"],
    ["walk-outline", r.sections.activity, r.status.great, "+14%", "green"],
    ["flash-outline", r.sections.stress, r.status.slightUp, "+5%", "orange"],
    ["restaurant-outline", r.sections.meals, r.status.photographed, "—", "orange"],
  ] as [IconName, string, string, string, "green" | "blue" | "orange"][];
  return (
    <View style={styles.screenPad}>
      <ScreenHeader title={r.title} eyebrow={r.eyebrow} right={<Pressable style={styles.share}><Ionicons name="share-outline" size={20} color={C.green} /></Pressable>} />
      <Card style={styles.reportScore}>
        <ScoreRing score={88} size={135} label={r.weekGreat} />
        <View style={{ flex: 1 }}>
          <Pill text={r.pill} />
          <RtlText style={styles.reportHeadline}>{r.headline}</RtlText>
          <RtlText style={styles.mutedText}>{r.sub}</RtlText>
        </View>
      </Card>
      <View style={styles.reportList}>
        {sections.map(([icon, label, status, change, tone]) => (
          <Card key={label} style={styles.reportRow}>
            <IconBubble name={icon} tone={tone} />
            <View style={{ flex: 1 }}>
              <RtlText style={styles.metricLabel}>{label}</RtlText>
              <RtlText style={styles.cardTitle}>{status}</RtlText>
            </View>
            <Text style={[styles.changeText, { color: tone === "orange" ? C.orange : C.green }]}>{change}</Text>
          </Card>
        ))}
      </View>
      <LinearGradient colors={[C.green, theme.primaryDark]} style={styles.aiSummary}>
        <View style={styles.aiTitle}>
          <Ionicons name="sparkles" color={C.lime} size={20} />
          <RtlText style={styles.aiTitleText}>{r.aiTitle}</RtlText>
        </View>
        <RtlText style={styles.aiBody}>{r.aiBody}</RtlText>
      </LinearGradient>
    </View>
  );
}

function Blood() {
  const { t } = useLocale();
  const b = t.blood;
  const [uploaded, setUploaded] = useState<string | null>(null);

  const pickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf", copyToCacheDirectory: true });
    if (!result.canceled && result.assets[0]?.name) {
      setUploaded(result.assets[0].name);
    }
  };

  return (
    <View style={styles.screenPad}>
      <ScreenHeader title={b.title} eyebrow={b.eyebrow} right={<IconBubble name="water-outline" tone="red" />} />
      <LinearGradient colors={[...theme.gradientUpload]} style={styles.uploadCard}>
        <View style={styles.uploadIcon}><Ionicons name="cloud-upload-outline" size={30} color={C.orange} /></View>
        <RtlText style={styles.cardTitle}>{b.uploadTitle}</RtlText>
        <RtlText style={styles.mutedText}>{uploaded ?? b.uploadSub}</RtlText>
        <Pressable onPress={pickPdf} style={styles.uploadButton}><RtlText style={styles.uploadButtonText}>{b.uploadBtn}</RtlText></Pressable>
      </LinearGradient>
      <RtlText style={styles.sectionTitle}>{b.vitaminD}</RtlText>
      <Card>
        <View style={styles.rowBetween}>
          <Pill text={b.improved} />
          <View>
            <RtlText style={styles.cardTitle}>34 ng/mL</RtlText>
            <RtlText style={styles.mutedText}>{b.inRange}</RtlText>
          </View>
        </View>
        <View style={styles.bloodGraph}>
          <View style={[styles.graphPoint, { left: "7%", bottom: 18 }]} />
          <View style={[styles.graphPoint, { right: "7%", bottom: 74 }]} />
          <View style={styles.graphLine} />
          <Text style={[styles.graphValue, { left: "2%", bottom: 36 }]}>22</Text>
          <Text style={[styles.graphValue, { right: "2%", bottom: 92 }]}>34</Text>
        </View>
      </Card>
    </View>
  );
}

function Timeline() {
  const { t } = useLocale();
  const tl = t.timeline;
  return (
    <View style={styles.screenPad}>
      <ScreenHeader title={tl.title} eyebrow={tl.eyebrow} right={<IconBubble name="calendar-outline" />} />
      <Card style={styles.timelineHero}>
        <View style={styles.rowBetween}>
          <Pill text={tl.positive} />
          <View>
            <RtlText style={styles.metricLabel}>{t.home.rhr}</RtlText>
            <View style={styles.valueRow}><Text style={styles.bigValue}>58</Text><Text style={styles.unit}>BPM</Text></View>
          </View>
        </View>
        <View style={{ height: 110, marginTop: 8 }}><MiniChart /></View>
        <View style={styles.months}>{tl.months.filter((_, i) => i % 2 === 0).map(m => <RtlText key={m} style={styles.month}>{m}</RtlText>)}</View>
      </Card>
    </View>
  );
}

function Chat() {
  const { t, isRtl, locale } = useLocale();
  const { user } = useAuth();
  const { metrics } = useHealth();
  const c = t.chat;
  const [value, setValue] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [thinking, setThinking] = useState(false);

  const send = async (text?: string) => {
    const q = (text ?? value).trim();
    if (!q || thinking) return;
    setValue("");
    setMessages(prev => [...prev, { role: "user", text: q }]);
    setThinking(true);
    try {
      const ctx = `RHR ${metrics.restingHr}, HRV ${metrics.hrv}, sleep ${metrics.sleepHours}h, stress ${metrics.stressScore}`;
      const reply = await askNova(q, locale, { metricsSummary: ctx });
      setMessages(prev => [...prev, { role: "assistant", text: reply }]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <View style={[styles.screenPad, { minHeight: Dimensions.get("window").height - 160 }]}>
      <ScreenHeader title={c.title} eyebrow={c.eyebrow} right={<IconBubble name="sparkles-outline" />} />
      <View style={styles.chatIntro}>
        <View style={styles.aiAvatar}><Text style={styles.aiAvatarText}>N</Text></View>
        <RtlText style={styles.chatGreeting}>{c.greeting.replace(/נועה|Noa/i, user?.user_metadata?.display_name?.split(" ")[0] ?? (locale === "he" ? "נועה" : "Noa"))}</RtlText>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.questionRow}>
        {c.chips.map(q => (
          <Pressable key={q} onPress={() => send(q)} style={styles.questionChip}><RtlText style={styles.questionText}>{q}</RtlText></Pressable>
        ))}
      </ScrollView>
      {messages.length === 0 && (
        <>
          <View style={styles.userBubble}><RtlText style={styles.userBubbleText}>{c.userQ}</RtlText></View>
          <View style={styles.novaMessage}>
            <View style={styles.aiAvatarSmall}><Text style={styles.aiAvatarSmallText}>N</Text></View>
            <View style={styles.novaBubble}>
              <RtlText style={styles.insightText}>{c.checked}</RtlText>
              <View style={styles.chatFacts}>
                {c.facts.map(f => <RtlText key={f} style={styles.chatFact}>• {f}</RtlText>)}
              </View>
              <RtlText style={[styles.insightText, { marginTop: 8 }]}>{c.reply}</RtlText>
            </View>
          </View>
        </>
      )}
      {messages.map((msg, i) =>
        msg.role === "user" ? (
          <View key={i} style={styles.userBubble}><RtlText style={styles.userBubbleText}>{msg.text}</RtlText></View>
        ) : (
          <View key={i} style={styles.novaMessage}>
            <View style={styles.aiAvatarSmall}><Text style={styles.aiAvatarSmallText}>N</Text></View>
            <View style={styles.novaBubble}><RtlText style={styles.insightText}>{msg.text}</RtlText></View>
          </View>
        ),
      )}
      {thinking && <RtlText style={styles.mutedText}>{c.thinking}</RtlText>}
      <View style={styles.chatInput}>
        <Pressable style={styles.send} onPress={() => send()}><Ionicons name="arrow-up" size={20} color={theme.onPrimary} /></Pressable>
        <TextInput value={value} onChangeText={setValue} placeholder={c.placeholder} placeholderTextColor={theme.placeholder} textAlign={isRtl ? "right" : "left"} style={styles.input} onSubmitEditing={() => send()} />
      </View>
    </View>
  );
}

function Engine() {
  const { t } = useLocale();
  const e = t.engine;
  const icons: IconName[] = ["watch-outline", "camera-outline", "server-outline", "finger-print-outline", "stats-chart-outline", "leaf-outline", "sparkles-outline"];
  const tones: ("green" | "orange" | "blue")[] = ["blue", "orange", "green", "green", "orange", "green", "green"];
  return (
    <View style={styles.screenPad}>
      <ScreenHeader title={e.title} eyebrow={e.eyebrow} right={<IconBubble name="git-network-outline" />} />
      <LinearGradient colors={[theme.primaryMuted, theme.bg]} style={styles.ruleCard}>
        <Ionicons name="shield-checkmark" size={28} color={C.green} />
        <View style={{ flex: 1 }}>
          <RtlText style={styles.cardTitle}>{e.ruleTitle}</RtlText>
          <RtlText style={styles.mutedText}>{e.ruleSub}</RtlText>
        </View>
      </LinearGradient>
      <View style={styles.pipeline}>
        {e.steps.map(([title, sub], i) => (
          <View key={title} style={styles.pipeRow}>
            <View style={styles.pipeRail}>
              <IconBubble name={icons[i]} tone={tones[i]} size={46} />
              {i < e.steps.length - 1 && <View style={styles.pipeLine} />}
            </View>
            <Card style={styles.pipeCard}>
              <RtlText style={styles.cardTitle}>{title}</RtlText>
              <RtlText style={styles.mutedText}>{sub}</RtlText>
            </Card>
          </View>
        ))}
      </View>
    </View>
  );
}

function AppShell() {
  const { t, isRtl, toggleLocale } = useLocale();
  const { signOut, requiresAuth } = useAuth();
  const [screen, setScreen] = useState<Screen>("welcome");
  const [menu, setMenu] = useState(false);
  const go = (next: Screen) => {
    setScreen(next);
    setMenu(false);
  };
  const screenLabels = allScreens.map(id => ({ id, label: t.screens[id], icon: screenIcons[id] }));
  const render = () => {
    switch (screen) {
      case "welcome": return <Welcome go={go} />;
      case "learning": return <Learning go={go} />;
      case "home": return <Home go={go} />;
      case "changes": return <Changes go={go} />;
      case "alert": return <Alert go={go} />;
      case "report": return <Report />;
      case "blood": return <Blood />;
      case "timeline": return <Timeline />;
      case "chat": return <Chat />;
      case "meal": return <MealCapture go={go} />;
      case "breathing": return <BreathingExercise go={go} />;
      case "engine": return <Engine />;
      case "settings": return <SettingsScreen go={go} />;
      case "privacy": return <PrivacyScreen go={go} />;
    }
  };
  const bottom: { id: Screen; label: string; icon: IconName }[] = [
    { id: "home", label: t.nav.home, icon: "home" },
    { id: "changes", label: t.nav.changes, icon: "analytics" },
    { id: "meal", label: t.nav.meal, icon: "camera" },
    { id: "chat", label: t.nav.chat, icon: "sparkles" },
  ];
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      {screen !== "welcome" && (
        <View style={[styles.topBar, isRtl ? styles.topBarRtl : styles.topBarLtr]}>
          <Pressable onPress={() => setMenu(!menu)} style={styles.menuButton}>
            <Ionicons name={menu ? "close" : "grid-outline"} size={20} color={C.ink} />
          </Pressable>
          <Text style={styles.topLogo}>NOVA</Text>
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <Pressable onPress={() => go("settings")} style={styles.menuButton}>
              <Ionicons name="settings-outline" size={20} color={C.muted} />
            </Pressable>
            <Pressable onPress={toggleLocale} style={styles.langButton}>
              <Text style={styles.langButtonText}>{t.langToggle}</Text>
            </Pressable>
          </View>
        </View>
      )}
      {screen === "welcome" && (
        <Pressable onPress={toggleLocale} style={styles.langButtonWelcome}>
          <Text style={styles.langButtonText}>{t.langToggle}</Text>
        </Pressable>
      )}
      {menu && (
        <View style={styles.menuPanel}>
          <RtlText style={styles.menuTitle}>{t.menuTitle}</RtlText>
          <View style={[styles.menuGrid, !isRtl && styles.menuGridLtr]}>
            {screenLabels.map(item => (
              <Pressable key={item.id} onPress={() => go(item.id)} style={[styles.menuItem, screen === item.id && styles.menuItemActive]}>
                <Ionicons name={item.icon} size={20} color={screen === item.id ? theme.onPrimary : C.green} />
                <RtlText style={[styles.menuItemText, screen === item.id && { color: theme.onPrimary }]}>{item.label}</RtlText>
              </Pressable>
            ))}
          </View>
          {requiresAuth && (
            <Pressable onPress={() => signOut()} style={styles.signOutButton}>
              <Ionicons name="log-out-outline" size={18} color={theme.danger} />
              <RtlText style={styles.signOutText}>{t.signOut}</RtlText>
            </Pressable>
          )}
        </View>
      )}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {render()}
      </ScrollView>
      {screen !== "welcome" && screen !== "learning" && screen !== "settings" && screen !== "privacy" && (
        <View style={[styles.bottomNav, !isRtl && styles.bottomNavLtr]}>
          {bottom.map(item => (
            <Pressable key={item.id} onPress={() => go(item.id)} style={styles.navItem}>
              <View style={[styles.navIcon, screen === item.id && styles.navIconActive]}>
                <Ionicons name={item.icon} size={21} color={screen === item.id ? theme.onPrimary : C.muted} />
              </View>
              <RtlText style={[styles.navText, screen === item.id && { color: C.green }]}>{item.label}</RtlText>
            </Pressable>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

function RootApp() {
  const { loading, session, requiresAuth } = useAuth();

  if (requiresAuth && loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  if (requiresAuth && !session) {
    return <AuthScreen />;
  }

  return <AppShell />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LocaleProvider>
        <AuthProvider>
          <HealthProvider>
            <SubscriptionProvider>
              <RootApp />
            </SubscriptionProvider>
          </HealthProvider>
        </AuthProvider>
      </LocaleProvider>
    </SafeAreaProvider>
  );
}

const shadow = Platform.select({
  web: { boxShadow: "0 8px 28px rgba(13, 148, 136, 0.12)" },
  default: { shadowColor: theme.shadow, shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
}) as any;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  full: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 28, minHeight: Dimensions.get("window").height - 20, justifyContent: "space-between" },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 110 },
  screenPad: { paddingHorizontal: 20, paddingTop: 16, gap: 16 },
  rtl: { writingDirection: "rtl", textAlign: "right", color: C.ink },
  ltr: { writingDirection: "ltr", textAlign: "left", color: C.ink },
  topBar: { height: 48, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.bg, zIndex: 20 },
  topBarRtl: { flexDirection: "row" },
  topBarLtr: { flexDirection: "row-reverse" },
  langButton: { minWidth: 38, height: 38, borderRadius: 19, backgroundColor: C.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border, paddingHorizontal: 10 },
  langButtonWelcome: { position: "absolute", top: 52, left: 20, zIndex: 30, minWidth: 38, height: 38, borderRadius: 19, backgroundColor: C.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border, paddingHorizontal: 10 },
  langButtonText: { color: C.green, fontWeight: "800", fontSize: 12 },
  topLogo: { fontSize: 20, letterSpacing: 4, fontWeight: "800", color: C.ink },
  menuButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border },
  menuPanel: { position: "absolute", zIndex: 15, top: 92, left: 14, right: 14, padding: 16, backgroundColor: C.card, borderRadius: 24, ...shadow },
  menuTitle: { fontSize: 15, fontWeight: "700", marginBottom: 12 },
  menuGrid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 },
  menuGridLtr: { flexDirection: "row" },
  signOutButton: { marginTop: 12, flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 4 },
  signOutText: { color: theme.danger, fontWeight: "700", fontSize: 14 },
  centered: { alignItems: "center", justifyContent: "center" },
  menuItem: { width: "31%", minHeight: 64, borderRadius: 14, alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: C.bg },
  menuItemActive: { backgroundColor: C.green },
  menuItemText: { fontSize: 11, textAlign: "center", fontWeight: "600" },
  card: { backgroundColor: C.card, borderRadius: 22, padding: 17, borderWidth: 1, borderColor: C.border, ...shadow },
  header: { flexDirection: "row-reverse", alignItems: "center", gap: 12, marginBottom: 2 },
  title: { fontSize: 28, lineHeight: 36, fontWeight: "800", letterSpacing: -0.5 },
  eyebrow: { fontSize: 12, color: C.green, fontWeight: "700", marginBottom: 3 },
  mutedText: { color: C.muted, fontSize: 13, lineHeight: 20 },
  cardTitle: { fontSize: 16, fontWeight: "750", lineHeight: 23 },
  sectionTitle: { fontSize: 18, fontWeight: "750", marginTop: 4 },
  iconBubble: { alignItems: "center", justifyContent: "center" },
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, alignSelf: "flex-start" },
  pillText: { fontSize: 11, fontWeight: "750", textAlign: "center" },
  primaryButton: { backgroundColor: C.green, minHeight: 56, borderRadius: 18, paddingHorizontal: 22, flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center", ...shadow },
  lightButton: { backgroundColor: C.mint, borderWidth: 1, borderColor: theme.lightButtonBorder },
  buttonText: { color: theme.onPrimary, fontWeight: "750", fontSize: 16, textAlign: "center" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logoMark: { width: 58, height: 58, backgroundColor: C.green, borderRadius: 20, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-6deg" }], marginBottom: 13, ...shadow },
  welcomeTop: { alignItems: "center", paddingTop: 20 },
  logo: { fontSize: 43, fontWeight: "850", color: C.ink, letterSpacing: 8 },
  tagline: { textAlign: "center", fontSize: 21, lineHeight: 30, fontWeight: "750", marginTop: 5 },
  welcomeCopy: { textAlign: "center", fontSize: 14, color: C.muted, lineHeight: 22, maxWidth: 330, marginTop: 10 },
  watchCard: { marginVertical: 20 },
  watchGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 },
  watchItem: { width: "48%", minHeight: 76, borderRadius: 16, backgroundColor: C.bg, padding: 9, flexDirection: "row", alignItems: "center", gap: 8 },
  watchName: { flex: 1, color: C.ink, fontSize: 11, fontWeight: "650" },
  disclaimer: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 7, marginBottom: 15 },
  disclaimerText: { color: C.muted, fontSize: 11, lineHeight: 17 },
  learningArt: { height: 155, justifyContent: "center", alignItems: "center" },
  orbitLarge: { width: 142, height: 142, borderRadius: 71, borderWidth: 1, borderColor: theme.borderSoft, alignItems: "center", justifyContent: "center", backgroundColor: theme.primaryMuted },
  orbitSmall: { width: 90, height: 90, borderRadius: 45, backgroundColor: C.card, alignItems: "center", justifyContent: "center", ...shadow },
  centerCopy: { textAlign: "center", color: C.muted, fontSize: 15, lineHeight: 24, paddingHorizontal: 12 },
  progressTrack: { height: 10, backgroundColor: theme.progressTrack, borderRadius: 99, overflow: "hidden", marginTop: 17 },
  progressFill: { height: "100%", backgroundColor: C.green, borderRadius: 99 },
  metricList: { marginTop: 10 },
  learningMetric: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: 52, borderBottomWidth: 1, borderBottomColor: C.border },
  learningMetricLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  listText: { fontSize: 14, fontWeight: "650" },
  heroCard: { borderRadius: 26, padding: 20, flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", ...shadow },
  heroTitle: { color: theme.onPrimary, fontSize: 20, fontWeight: "750", marginTop: 12 },
  heroCopy: { color: theme.onPrimaryMuted, fontSize: 12, marginTop: 5 },
  score: { fontWeight: "850", color: C.ink },
  scoreLabel: { fontSize: 10, color: C.muted, textAlign: "center" },
  quickRow: { flexDirection: "row-reverse", justifyContent: "space-between", gap: 8 },
  quickAction: { flex: 1, alignItems: "center", gap: 6, paddingVertical: 12, backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border },
  quickActionLabel: { fontSize: 11, fontWeight: "650", textAlign: "center" },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metricCard: { width: "48.5%", padding: 14 },
  metricLabel: { fontSize: 12, color: C.muted, marginTop: 10 },
  valueRow: { flexDirection: "row", alignItems: "baseline", gap: 5 },
  metricValue: { color: C.ink, fontSize: 26, fontWeight: "800", marginVertical: 3 },
  bigValue: { color: C.ink, fontSize: 38, fontWeight: "850" },
  unit: { color: C.muted, fontSize: 10, fontWeight: "650" },
  recoveryCard: { flexDirection: "row-reverse", alignItems: "center", gap: 12 },
  recoveryValue: { fontSize: 21, color: C.green, fontWeight: "800" },
  mealContext: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 10, backgroundColor: theme.primaryMuted },
  mealContextText: { flex: 1, fontSize: 13, lineHeight: 20, color: C.ink },
  cameraFrame: { borderRadius: 24, borderWidth: 2, borderStyle: "dashed", borderColor: theme.cameraBorder, backgroundColor: theme.cameraBg, minHeight: 220, overflow: "hidden" },
  cameraInner: { flex: 1, minHeight: 220, alignItems: "center", justifyContent: "center", gap: 12 },
  cameraHint: { color: C.muted, fontSize: 14 },
  tipList: { gap: 8 },
  tipRow: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  tipText: { fontSize: 13, color: C.muted },
  mealResult: { flexDirection: "row-reverse", gap: 14, alignItems: "center" },
  mealPhotoPlaceholder: { width: 72, height: 72, borderRadius: 16, backgroundColor: C.peach, alignItems: "center", justifyContent: "center" },
  macroRow: { flexDirection: "row-reverse", gap: 12, marginTop: 8 },
  macro: { alignItems: "center" },
  macroVal: { fontWeight: "800", fontSize: 15, color: C.ink },
  macroLbl: { fontSize: 10, color: C.muted },
  linkBtn: { alignItems: "center", paddingVertical: 8 },
  linkText: { color: C.green, fontWeight: "650", fontSize: 14 },
  breathingPad: { minHeight: Dimensions.get("window").height - 200 },
  stressCard: { gap: 8 },
  breatheCenter: { alignItems: "center", paddingVertical: 24 },
  breatheRing: { width: 200, height: 200, borderRadius: 100, backgroundColor: C.mint, borderWidth: 3, borderColor: theme.borderChip, alignItems: "center", justifyContent: "center" },
  breatheInner: { alignItems: "center", gap: 6 },
  breathePhase: { fontSize: 22, fontWeight: "800", color: C.green },
  breatheTimer: { fontSize: 28, fontWeight: "850", color: C.ink },
  breatheSteps: { gap: 10, marginBottom: 8 },
  breatheStep: { flexDirection: "row-reverse", alignItems: "center", gap: 12 },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.green, alignItems: "center", justifyContent: "center" },
  stepNumText: { color: theme.onPrimary, fontWeight: "800", fontSize: 13 },
  breatheCta: { flexDirection: "row-reverse", alignItems: "center", gap: 12, padding: 16, backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border, ...shadow },
  changeHero: { gap: 6 },
  factorGrid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 },
  factor: { width: "31.5%", height: 76, borderRadius: 16, backgroundColor: theme.factorBg, alignItems: "center", justifyContent: "center", gap: 4, borderWidth: 1, borderColor: "transparent" },
  factorActive: { backgroundColor: C.mint, borderColor: theme.factorActiveBorder },
  factorText: { fontSize: 11, color: C.muted, fontWeight: "650", textAlign: "center" },
  insightCard: { backgroundColor: theme.insightCardBg },
  insightTop: { flexDirection: "row-reverse", alignItems: "center", gap: 10, marginBottom: 12 },
  insightText: { fontSize: 14, lineHeight: 23 },
  protection: { padding: 17, borderRadius: 20, flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: theme.borderSoft },
  protectionValue: { color: C.green, fontSize: 29, fontWeight: "850" },
  alertBanner: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  alertLead: { fontSize: 18, color: C.muted, lineHeight: 26 },
  alertMetric: { minHeight: 64, flexDirection: "row-reverse", alignItems: "center", gap: 11, borderBottomWidth: 1, borderBottomColor: C.border },
  alertValue: { fontSize: 19, fontWeight: "800" },
  recommendation: { paddingVertical: 4 },
  recommendationInner: { flexDirection: "row-reverse", alignItems: "center", gap: 11, paddingVertical: 10 },
  medicalNote: { flexDirection: "row-reverse", alignItems: "center", gap: 7, paddingHorizontal: 8 },
  share: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: C.border, backgroundColor: C.card, alignItems: "center", justifyContent: "center" },
  reportScore: { flexDirection: "row-reverse", alignItems: "center", gap: 16 },
  reportHeadline: { fontSize: 19, fontWeight: "800", marginTop: 10 },
  reportList: { gap: 9 },
  reportRow: { flexDirection: "row-reverse", alignItems: "center", gap: 11, paddingVertical: 12 },
  changeText: { fontSize: 15, fontWeight: "750" },
  aiSummary: { borderRadius: 22, padding: 19 },
  aiTitle: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  aiTitleText: { color: theme.onPrimary, fontWeight: "750", fontSize: 15 },
  aiBody: { color: theme.onPrimary, fontSize: 14, lineHeight: 24, marginTop: 11 },
  uploadCard: { alignItems: "center", padding: 22, borderRadius: 23, borderWidth: 1, borderColor: theme.uploadBorder },
  uploadIcon: { width: 58, height: 58, borderRadius: 29, backgroundColor: C.card, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  uploadButton: { backgroundColor: C.orange, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 11, marginTop: 14 },
  uploadButtonText: { color: theme.onPrimary, fontWeight: "750", fontSize: 13 },
  bloodGraph: { height: 125, marginVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, overflow: "hidden" },
  graphPoint: { position: "absolute", width: 13, height: 13, borderRadius: 7, backgroundColor: C.green, zIndex: 2, borderWidth: 3, borderColor: C.card },
  graphLine: { position: "absolute", left: "9%", right: "9%", bottom: 50, height: 3, backgroundColor: C.green, transform: [{ rotate: "-12deg" }], borderRadius: 3 },
  graphValue: { position: "absolute", color: C.green, fontWeight: "800" },
  timelineHero: { minHeight: 200 },
  months: { flexDirection: "row-reverse", justifyContent: "space-between" },
  month: { fontSize: 10, color: C.muted },
  chatIntro: { alignItems: "center", paddingVertical: 12 },
  aiAvatar: { width: 66, height: 66, borderRadius: 24, backgroundColor: theme.ai, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-4deg" }], ...shadow },
  aiAvatarText: { fontSize: 31, color: theme.onPrimary, fontWeight: "850" },
  chatGreeting: { textAlign: "center", fontSize: 17, fontWeight: "700", lineHeight: 25, marginTop: 13, maxWidth: 280 },
  questionRow: { gap: 8, flexDirection: "row-reverse", paddingVertical: 3 },
  questionChip: { borderWidth: 1, borderColor: theme.borderChip, backgroundColor: C.card, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 16 },
  questionText: { fontSize: 12, color: C.green, fontWeight: "650" },
  userBubble: { alignSelf: "flex-end", backgroundColor: C.green, borderRadius: 18, borderBottomRightRadius: 5, paddingHorizontal: 15, paddingVertical: 11, maxWidth: "82%" },
  userBubbleText: { color: theme.onPrimary, fontSize: 14 },
  novaMessage: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  aiAvatarSmall: { width: 32, height: 32, borderRadius: 11, backgroundColor: theme.ai, alignItems: "center", justifyContent: "center" },
  aiAvatarSmallText: { color: theme.onPrimary, fontWeight: "800" },
  novaBubble: { flex: 1, borderRadius: 19, borderTopLeftRadius: 5, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, padding: 15 },
  chatFacts: { backgroundColor: C.bg, borderRadius: 14, padding: 11, marginTop: 9, gap: 4 },
  chatFact: { fontSize: 13, lineHeight: 20, fontWeight: "650" },
  chatInput: { marginTop: "auto", flexDirection: "row", alignItems: "center", gap: 9, borderRadius: 19, borderWidth: 1, borderColor: C.border, backgroundColor: C.card, padding: 7, ...shadow },
  input: { flex: 1, minHeight: 42, paddingHorizontal: 8, color: C.ink, fontSize: 13 },
  send: { width: 40, height: 40, borderRadius: 14, backgroundColor: C.green, alignItems: "center", justifyContent: "center" },
  ruleCard: { padding: 17, borderRadius: 21, borderWidth: 1, borderColor: theme.borderSoft, flexDirection: "row-reverse", gap: 12, alignItems: "center" },
  pipeline: { gap: 0 },
  pipeRow: { flexDirection: "row-reverse", gap: 10, minHeight: 86 },
  pipeRail: { width: 48, alignItems: "center" },
  pipeLine: { flex: 1, width: 2, backgroundColor: theme.pipeLine },
  pipeCard: { flex: 1, padding: 14, marginBottom: 9 },
  bottomNav: { height: 78, position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(255,255,255,.97)", borderTopWidth: 1, borderTopColor: C.border, flexDirection: "row-reverse", justifyContent: "space-around", paddingTop: 7, ...shadow },
  bottomNavLtr: { flexDirection: "row" },
  navItem: { alignItems: "center", gap: 3, minWidth: 58 },
  navIcon: { width: 36, height: 32, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  navIconActive: { backgroundColor: C.green },
  navText: { fontSize: 10, color: C.muted, fontWeight: "650", textAlign: "center" },
} as any);
