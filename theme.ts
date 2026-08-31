/**
 * NOVA Design System — "Vital Clarity"
 * Rich teal health + vivid accents (violet AI, coral meals, sky metrics).
 * Tuned for retention: warm canvas, sharp CTAs, push-friendly contrast.
 */
export const theme = {
  /** Primary brand — saturated teal */
  primary: "#14B8A6",
  primaryDark: "#0D9488",
  primaryLight: "#2DD4BF",
  primaryMuted: "#CCFBF1",

  /** Surfaces — mint-tinted, not flat gray */
  bg: "#F0FAF9",
  card: "#FFFFFF",
  border: "#99F6E4",

  /** Text — crisp contrast */
  ink: "#0B1220",
  muted: "#475569",
  onPrimary: "#FFFFFF",
  onPrimaryMuted: "#ECFEFF",

  /** Semantic — each feature has its own hue */
  success: "#059669",
  successBg: "#D1FAE5",
  info: "#2563EB",
  infoBg: "#DBEAFE",
  warning: "#EA580C",
  warningBg: "#FFEDD5",
  danger: "#E11D48",
  dangerBg: "#FFE4E6",

  /** AI / NOVA chat — vivid violet (distinct from health teal) */
  ai: "#7C3AED",
  aiDark: "#6D28D9",
  aiBg: "#EDE9FE",
  aiAccent: "#C4B5FD",

  /** Meals & warmth — coral orange */
  coral: "#F97316",
  coralBg: "#FFF7ED",

  /** UI derivatives */
  ringTrack: "#A7F3D0",
  gradientWelcome: ["#5EEAD4", "#BAE6FD", "#F0FAF9"] as const,
  gradientHero: ["#14B8A6", "#0D9488"] as const,
  gradientAi: ["#8B5CF6", "#6D28D9"] as const,
  gradientProtection: ["#D1FAE5", "#ECFEFF"] as const,
  gradientUpload: ["#FFEDD5", "#FEF3C7"] as const,
  borderSoft: "#5EEAD4",
  borderChip: "#2DD4BF",
  pipeLine: "#94A3B8",
  factorBg: "#ECFDF5",
  factorActiveBorder: "#14B8A6",
  placeholder: "#94A3B8",
  shadow: "#14B8A6",
  lightButtonBorder: "#14B8A6",
  progressTrack: "#A7F3D0",
  cameraBorder: "#FB923C",
  cameraBg: "#FFF7ED",
  uploadBorder: "#F97316",
  insightCardBg: "#EDE9FE",
  pillOrangeText: "#C2410C",
  grayPillBg: "#E2E8F0",
} as const;

export type Theme = typeof theme;
