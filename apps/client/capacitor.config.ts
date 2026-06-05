import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.fintr.famivault",
  appName: "FamiVault",
  webDir: "dist",
  plugins: {
    GoogleAuth: {
      scopes: ["profile", "email"],
      // Standard Google OAuth Web Client ID (configured in Google Developer Console)
      clientId: "133588067257-0huo4ja0kaavpg704si2htphl0kvgobt.apps.googleusercontent.com",
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
