import { Platform } from "react-native";
import type { HealthMetrics } from "../types/health";
import { MOCK_METRICS } from "./metrics";

/** iOS HealthKit — only in native dev/production builds */
export async function fetchFromHealthKit(): Promise<HealthMetrics | null> {
  if (Platform.OS !== "ios") return null;
  try {
    const Healthkit = require("@kingstinct/react-native-healthkit");
    const { requestAuthorization, queryQuantitySamples } = Healthkit;

    await requestAuthorization({
      toRead: [
        "HKQuantityTypeIdentifierHeartRate",
        "HKQuantityTypeIdentifierHeartRateVariabilitySDNN",
        "HKQuantityTypeIdentifierStepCount",
        "HKQuantityTypeIdentifierBodyTemperature",
        "HKCategoryTypeIdentifierSleepAnalysis",
      ],
    });

    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [hrSamples, hrvSamples, stepSamples, tempSamples, sleepSamples] = await Promise.all([
      queryQuantitySamples("HKQuantityTypeIdentifierHeartRate", { from: dayAgo, to: now, limit: 20 }),
      queryQuantitySamples("HKQuantityTypeIdentifierHeartRateVariabilitySDNN", { from: dayAgo, to: now, limit: 5 }),
      queryQuantitySamples("HKQuantityTypeIdentifierStepCount", { from: dayAgo, to: now, limit: 1 }),
      queryQuantitySamples("HKQuantityTypeIdentifierBodyTemperature", { from: dayAgo, to: now, limit: 1 }),
      queryQuantitySamples("HKCategoryTypeIdentifierSleepAnalysis", { from: dayAgo, to: now, limit: 10 }),
    ]);

    const restingHr = hrSamples?.length
      ? Math.round(hrSamples.reduce((s: number, x: { quantity: number }) => s + x.quantity, 0) / hrSamples.length)
      : null;
    const hrv = hrvSamples?.[0]?.quantity ?? null;
    const steps = stepSamples?.[0]?.quantity != null ? Math.round(stepSamples[0].quantity) : null;
    const bodyTemp = tempSamples?.[0]?.quantity ?? null;

    let sleepHours: number | null = null;
    if (sleepSamples?.length) {
      const asleep = sleepSamples.filter((s: { value: number }) => s.value === 1);
      if (asleep.length) {
        sleepHours = Math.round((asleep.length * 0.5) * 10) / 10;
      }
    }

    const stressScore = hrv != null ? Math.round(Math.max(10, Math.min(90, 100 - hrv * 0.6))) : null;

    return {
      restingHr,
      hrv: hrv != null ? Math.round(hrv) : null,
      sleepHours,
      steps,
      bodyTemp: bodyTemp != null ? Math.round(bodyTemp * 10) / 10 : null,
      stressScore,
      recordedAt: now.toISOString(),
      source: "healthkit",
    };
  } catch {
    return null;
  }
}

export async function requestHealthKitPermission(): Promise<boolean> {
  if (Platform.OS !== "ios") return false;
  try {
    const Healthkit = require("@kingstinct/react-native-healthkit");
    await Healthkit.requestAuthorization({
      toRead: [
        "HKQuantityTypeIdentifierHeartRate",
        "HKQuantityTypeIdentifierHeartRateVariabilitySDNN",
        "HKQuantityTypeIdentifierStepCount",
        "HKQuantityTypeIdentifierBodyTemperature",
        "HKCategoryTypeIdentifierSleepAnalysis",
      ],
    });
    return true;
  } catch {
    return false;
  }
}

export function isHealthKitAvailable(): boolean {
  return Platform.OS === "ios";
}

export function isHealthConnectAvailable(): boolean {
  return Platform.OS === "android";
}

/** Samsung / Galaxy — native APK + Health Connect (not Web) */
export async function fetchFromHealthConnect(): Promise<HealthMetrics | null> {
  if (Platform.OS !== "android") return null;
  try {
    const { readRecords } = require("react-native-health-connect");
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const hr = await readRecords("HeartRate", { timeRangeFilter: { operator: "between", startTime: dayAgo.toISOString(), endTime: now.toISOString() } });
    const steps = await readRecords("Steps", { timeRangeFilter: { operator: "between", startTime: dayAgo.toISOString(), endTime: now.toISOString() } });
    const restingHr = hr?.records?.length
      ? Math.round(hr.records.reduce((s: number, r: { beatsPerMinute: number }) => s + r.beatsPerMinute, 0) / hr.records.length)
      : null;
    const stepCount = steps?.records?.reduce((s: number, r: { count: number }) => s + r.count, 0) ?? null;
    return {
      restingHr,
      hrv: null,
      sleepHours: null,
      steps: stepCount != null ? Math.round(stepCount) : null,
      bodyTemp: null,
      stressScore: null,
      recordedAt: now.toISOString(),
      source: "health_connect",
    };
  } catch {
    return null;
  }
}

export async function requestHealthConnectPermission(): Promise<boolean> {
  if (Platform.OS !== "android") return false;
  try {
    const { initialize, requestPermission } = require("react-native-health-connect");
    await initialize();
    await requestPermission([
      { accessType: "read", recordType: "HeartRate" },
      { accessType: "read", recordType: "Steps" },
      { accessType: "read", recordType: "SleepSession" },
    ]);
    return true;
  } catch {
    return false;
  }
}

export async function fetchHealthMetrics(): Promise<HealthMetrics> {
  const fromKit = await fetchFromHealthKit();
  if (fromKit) return fromKit;
  const fromHc = await fetchFromHealthConnect();
  if (fromHc) return fromHc;
  return { ...MOCK_METRICS, recordedAt: new Date().toISOString() };
}

export async function requestHealthPermission(): Promise<boolean> {
  if (Platform.OS === "ios") return requestHealthKitPermission();
  if (Platform.OS === "android") return requestHealthConnectPermission();
  return false;
}
