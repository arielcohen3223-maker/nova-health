/** @type {import('expo/config').ExpoConfig} */
export default ({ config }) => ({
  ...config,
  name: "NOVA",
  slug: "nova-health",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "nova",
  userInterfaceStyle: "light",
  icon: "./assets/icon.png",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#FAFAFA",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: false,
    bundleIdentifier: "health.nova.app",
    buildNumber: "1",
    config: {
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      NSHealthShareUsageDescription:
        "NOVA reads heart rate, HRV, sleep, and activity from Apple Health to build your personal baseline.",
      NSHealthUpdateUsageDescription: "NOVA may write wellness summaries to Apple Health.",
      NSCameraUsageDescription: "NOVA uses the camera to photograph meals for wellness context.",
      NSPhotoLibraryUsageDescription: "NOVA accesses photos to analyze meals.",
      ITSAppUsesNonExemptEncryption: false,
    },
    privacyManifests: {
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults",
          NSPrivacyAccessedAPITypeReasons: ["CA92.1"],
        },
      ],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#0D9488",
    },
    package: "health.nova.app",
    versionCode: 1,
    permissions: [
      "android.permission.health.READ_HEART_RATE",
      "android.permission.health.READ_SLEEP",
      "android.permission.CAMERA",
    ],
  },
  web: {
    bundler: "metro",
    favicon: "./assets/favicon.png",
    name: "NOVA",
    shortName: "NOVA",
    description: "Personal health intelligence — explain before alerting.",
    themeColor: "#0D9488",
    backgroundColor: "#FAFAFA",
    display: "standalone",
    lang: "he",
  },
  plugins: [
    "expo-dev-client",
    [
      "@kingstinct/react-native-healthkit",
      {
        NSHealthShareUsageDescription:
          "NOVA reads heart rate, HRV, sleep, and activity from Apple Health.",
        NSHealthUpdateUsageDescription: "NOVA may write wellness summaries to Apple Health.",
      },
    ],
    [
      "expo-image-picker",
      {
        cameraPermission: "NOVA uses the camera to log meals for wellness context.",
      },
    ],
  ],
  extra: {
    eas: {
      projectId: process.env.EAS_PROJECT_ID ?? "REPLACE_AFTER_eas_init",
    },
    privacyPolicyUrl:
      process.env.EXPO_PUBLIC_PRIVACY_URL ?? "https://nova-health-eight.vercel.app/legal/privacy.html",
    termsUrl: process.env.EXPO_PUBLIC_TERMS_URL ?? "https://nova-health-eight.vercel.app/legal/terms.html",
  },
  owner: "arielcohen3223-maker",
});
