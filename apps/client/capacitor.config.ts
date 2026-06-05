import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.fintr.famivault",
  appName: "FamiVault",
  webDir: "dist",
  plugins: {
    GoogleAuth: {
      scopes: ["profile", "email"],
      // Standard Google OAuth Web Client ID (configured in Google Developer Console)
      clientId: "30564891683-s56f75ginc4a30sps38j6j51hh3dpthc.apps.googleusercontent.com",
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
