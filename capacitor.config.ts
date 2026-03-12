import type { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize } from "@capacitor/keyboard";

const serverUrl =
  process.env.CAPACITOR_SERVER_URL || "https://novoriqlimited.netlify.app";

const config: CapacitorConfig = {
  appId: "com.novoriq.flow",
  appName: "Novoriq Flow",
  webDir: "capacitor-shell",
  backgroundColor: "#f6f0e5",
  server: {
    url: serverUrl,
    cleartext: false,
    allowNavigation: ["novoriqlimited.netlify.app"],
    errorPath: "offline.html"
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: "#132226",
      showSpinner: false,
      androidScaleType: "CENTER_CROP"
    },
    StatusBar: {
      backgroundColor: "#132226",
      style: "DARK",
      overlaysWebView: false
    },
    Keyboard: {
      resize: KeyboardResize.Body
    }
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;
