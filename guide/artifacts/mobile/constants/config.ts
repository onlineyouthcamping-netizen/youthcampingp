import { Platform } from "react-native";

// If EXPO_PUBLIC_API_URL is defined in .env, use it; otherwise fallback to defaults
const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL;

const DEV_HOST = Platform.select({
  android: "http://10.0.2.2:5000",
  web: "http://localhost:5000",
  default: "http://192.168.1.17:5000",
});

export const API_BASE_URL = ENV_API_URL ? ENV_API_URL.replace(/\/api$/, "") : DEV_HOST;
export const API_URL = ENV_API_URL || `${API_BASE_URL}/api`;

