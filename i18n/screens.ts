import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

export type Screen =
  | "welcome"
  | "learning"
  | "home"
  | "changes"
  | "alert"
  | "report"
  | "blood"
  | "timeline"
  | "chat"
  | "engine"
  | "meal"
  | "breathing"
  | "settings"
  | "privacy";

type IconName = ComponentProps<typeof Ionicons>["name"];

export const screenIcons: Record<Screen, IconName> = {
  welcome: "sparkles-outline",
  learning: "pulse-outline",
  home: "home-outline",
  changes: "analytics-outline",
  alert: "notifications-outline",
  report: "document-text-outline",
  blood: "water-outline",
  timeline: "trending-up-outline",
  chat: "chatbubble-ellipses-outline",
  meal: "camera-outline",
  breathing: "leaf-outline",
  engine: "git-network-outline",
  settings: "settings-outline",
  privacy: "lock-closed-outline",
};

export const allScreens: Screen[] = [
  "welcome",
  "learning",
  "home",
  "changes",
  "alert",
  "report",
  "blood",
  "timeline",
  "chat",
  "meal",
  "breathing",
  "settings",
  "engine",
];
