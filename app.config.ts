import 'dotenv/config';

// Read directly from process.env with fallbacks
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://pmrcbkekxnsbpkqdemev.supabase.co";
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcmNia2VreG5zYnBrcWRlbWV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NTUxOTYsImV4cCI6MjA1OTAzMTE5Nn0.2DpAXazhkfIGK793ZamTBxheyOcPFjuu_ScryoJ32aA";

// Add debug logging for environment variables
console.info("[app.config] Supabase configuration:");
console.info("[app.config] SUPABASE_URL set:", !!supabaseUrl);
console.info("[app.config] SUPABASE_ANON_KEY set:", !!supabaseKey);

export default {
  name: "Fantasy AI",
  version: "1.0.1",
  extra: {
    "eas": {
        "projectId": "518dbf1d-122d-4f86-9940-1ef2f1137a2e"
      },
    supabaseUrl,  // Use the variables we defined above
    supabaseKey,
  },
  plugins: [
    [
      "expo-build-properties",
      {
        ios: {
          deploymentTarget: "15.1"
        },
        android: {
          compileSdkVersion: 33,
          targetSdkVersion: 33,
          buildToolsVersion: "33.0.0"
        }
      }
    ]
  ],
  android: {
    package: "com.fantasyai.app",
    versionCode: 8,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#FFFFFF"
    }
  },
  ios: {
    bundleIdentifier: "com.fantasyai.app",
    buildNumber: "1.0.0",
    supportsTablet: true
  }
};