import { DarkTheme } from "@react-navigation/native";

/**
 * WaveChat — WhatsApp iOS Dark Theme
 * All colors match the WhatsApp iOS dark mode specification.
 */

export const Colors = {
  // Brand
  primary: "#25D366",
  primaryDark: "#1DA851",
  primaryDeep: "#0A332C",
  primarySoft: "#2EDE6E",

  // Backgrounds
  bg: "#000000",
  bgSecondary: "#0A0A0A",
  bgPanel: "#1C1C1E",
  bgHover: "#2C2C2E",
  bgActive: "#3A3A3C",
  bgBubbleIn: "#1C1C1E",
  bgBubbleOut: "#005C4B",
  bgInput: "#1C1C1E",
  bgModal: "#2C2C2E",
  bgDarkRaised: "#1C1C1E",
  bgStatusCard: "#1C1C1E",

  // Text
  text: "#FFFFFF",
  textSecondary: "#8E8E93",
  textMuted: "#8E8E93",
  textPlaceholder: "#8E8E93",
  textHeader: "#FFFFFF",

  // Accents
  online: "#34C759",
  readReceipt: "#53BDDC",
  danger: "#FF3B30",
  warning: "#FFD60A",
  link: "#0A84FF",
  star: "#FFD60A",
  textLink: "#0A84FF",
  border: "rgba(255,255,255,0.08)",
  borderLight: "rgba(255,255,255,0.12)",
  white: "#FFFFFF",
  black: "#000000",

  // Chat bubbles in light wallpaper mode
  bubbleOutLight: "#D9FDD3",
  bubbleInLight: "#FFFFFF",

  // WhatsApp iOS Floating Tab Bar
  tabBarBg: "rgba(28,28,30,0.72)",
  tabBarBorder: "rgba(255,255,255,0.1)",
  tabBarSelected: "#2C2C2E",

  // Floating Action Buttons
  fabBg: "#1C1C1E",
  fabShadow: "#000000",
};

export const darkTheme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.primary,
    background: Colors.bg,
    card: Colors.bgPanel,
    text: Colors.text,
    border: Colors.border,
    notification: Colors.primary,
  },
};

