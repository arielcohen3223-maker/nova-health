/**
 * NOVA Design System — "Calm Intelligence"
 * Teal + white + soft slate. AI accent: indigo (use sparingly).
 * Change colors here only — App.tsx reads from this file.
 */
export const theme = {
  /** Primary brand — teal */
  primary: "#0D9488",
  primaryDark: "#0F766E",
  primaryLight: "#CCFBF1",
  primaryMuted: "#F0FDFA",

  /** Surfaces */
  bg: "#FAFAFA",
  card: "#FFFFFF",
  border: "#E2E8F0",

  /** Text */
  ink: "#0F172A",
  muted: "#64748B",
  onPrimary: "#FFFFFF",
  onPrimaryMuted: "#99F6E4",

  /** Semantic — data & status */
  success: "#0D9488",
  successBg: "#CCFBF1",
  info: "#0284C7",
  infoBg: "#E0F2FE",
  warning: "#F59E0B",
  warningBg: "#FEF3C7",
  danger: "#EF4444",
  dangerBg: "#FEE2E2",

  /** AI — NOVA sparkles / chat only */
  ai: "#6366F1",
  aiBg: "#EEF2FF",
  aiAccent: "#C7D2FE",

  /** UI derivatives */
  ringTrack: "#E2E8F0",
  gradientWelcome: ["#F0FDFA", "#FAFAFA", "#ECFEFF"] as const,
  gradientProtection: ["#F0FDFA", "#FAFAFA"] as const,
  gradientUpload: ["#FFFBEB", "#FEFCE8"] as const,
  borderSoft: "#99F6E4",
  borderChip: "#5EEAD4",
  pipeLine: "#CBD5E1",
  factorBg: "#F1F5F9",
  factorActiveBorder: "#5EEAD4",
  placeholder: "#94A3B8",
  shadow: "#0D9488",
  lightButtonBorder: "#5EEAD4",
  progressTrack: "#E2E8F0",
  cameraBorder: "#FDE68A",
  cameraBg: "#FFFBEB",
  uploadBorder: "#FCD34D",
  insightCardBg: "#F8FAFC",
  pillOrangeText: "#B45309",
  grayPillBg: "#F1F5F9",
} as const;

export type Theme = typeof theme;
