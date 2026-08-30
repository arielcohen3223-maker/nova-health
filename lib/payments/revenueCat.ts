import { Platform } from "react-native";
import { config } from "../config";

export type SubscriptionTier = "free" | "pro";

let initialized = false;

function getApiKey(): string | null {
  if (Platform.OS === "ios") return process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY?.trim() ?? null;
  if (Platform.OS === "android") return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY?.trim() ?? null;
  return null;
}

export async function initPurchases(userId?: string): Promise<void> {
  const apiKey = getApiKey();
  if (!apiKey || Platform.OS === "web") return;
  try {
    const Purchases = require("react-native-purchases").default;
    Purchases.configure({ apiKey, appUserID: userId });
    initialized = true;
  } catch {
    initialized = false;
  }
}

export async function getSubscriptionTier(): Promise<SubscriptionTier> {
  if (!initialized || Platform.OS === "web") return "free";
  try {
    const Purchases = require("react-native-purchases").default;
    const info = await Purchases.getCustomerInfo();
    const pro = info.entitlements.active?.pro ?? info.entitlements.active?.nova_pro;
    return pro ? "pro" : "free";
  } catch {
    return "free";
  }
}

export async function purchasePro(): Promise<boolean> {
  if (!initialized) return false;
  try {
    const Purchases = require("react-native-purchases").default;
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages?.[0];
    if (!pkg) return false;
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return Boolean(customerInfo.entitlements.active?.pro ?? customerInfo.entitlements.active?.nova_pro);
  } catch {
    return false;
  }
}

export async function restorePurchases(): Promise<SubscriptionTier> {
  if (!initialized) return "free";
  try {
    const Purchases = require("react-native-purchases").default;
    const info = await Purchases.restorePurchases();
    const pro = info.entitlements.active?.pro ?? info.entitlements.active?.nova_pro;
    return pro ? "pro" : "free";
  } catch {
    return "free";
  }
}

export function isPurchasesConfigured(): boolean {
  return Boolean(getApiKey()) && config.isConfigured;
}
