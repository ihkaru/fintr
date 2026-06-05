import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.fintr.famivault",
  appName: "FamiVault",
  webDir: "dist",
  plugins: {
    GoogleAuth: {
      scopes: ["profile", "email"],
      // Standard Google OAuth Web Client ID (configured in Google Developer Console)
      clientId: "535694208493-demo.apps.googleusercontent.com",
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
