import appJson from "./app.json";

const config = appJson.expo;
const androidPackage = process.env.EXPO_ANDROID_PACKAGE;
const iosBundleIdentifier = process.env.EXPO_IOS_BUNDLE_IDENTIFIER;

if (
  process.env.EAS_BUILD_PROFILE === "production" &&
  (!androidPackage || !iosBundleIdentifier || !process.env.EXPO_PUBLIC_API_URL)
) {
  throw new Error(
    "Production builds require EXPO_ANDROID_PACKAGE, EXPO_IOS_BUNDLE_IDENTIFIER and EXPO_PUBLIC_API_URL.",
  );
}

export default {
  ...config,
  name: "Kropki",
  slug: "kropki",
  android: {
    ...config.android,
    package: androidPackage ?? config.android.package,
  },
  ios: {
    ...config.ios,
    bundleIdentifier: iosBundleIdentifier ?? config.ios.bundleIdentifier,
  },
  extra: {
    ...config.extra,
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? config.extra.apiUrl,
  },
};
