declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_ANDROID_PACKAGE?: string;
    EXPO_IOS_BUNDLE_IDENTIFIER?: string;
    EAS_BUILD_PROFILE?: string;
    REQUIRE_EMAIL_VERIFICATION?: string;
    BETTER_AUTH_SECRET?: string;
    APPLICATION_ID?: string;
    VITE_RUNABLE_AUTH_ISSUER?: string;
    DATABASE_URL?: string;
    DATABASE_AUTH_TOKEN?: string;
    RESEND_API_KEY?: string;
    EMAIL_FROM?: string;
    TRUSTED_ORIGINS?: string;
  }
}
