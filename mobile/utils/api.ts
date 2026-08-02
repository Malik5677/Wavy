import Constants from "expo-constants";

/**
 * Resolve the backend API base URL.
 * Precedence:
 *  1. EXPO_PUBLIC_API_URL env var
 *  2. Expo extra `apiUrl` from app.json
 *  3. Hardcoded production backend
 */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ||
  "https://wavy-10lu.onrender.com";

/** Helper to build a full uploads URL for avatars / attachments. */
export const mediaUrl = (url?: string | null) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

