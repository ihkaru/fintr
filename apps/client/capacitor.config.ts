import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.fintr.famivault",
  appName: "FamiVault",
  webDir: "dist",
  plugins: {
    GoogleAuth: {
      scopes: ["profile", "email"],
      // Standard Google OAuth Web Client ID (configured in Google Developer Console)
      clientId: "30564891683-6k4nfjjds7h0c2ldarpd3uavpo5vc7ga.apps.googleusercontent.com",
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
