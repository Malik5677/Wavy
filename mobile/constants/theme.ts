import { DarkTheme } from "@react-navigation/native";

export const Colors = {
  primary: "#7C4DFF",
  primaryDark: "#6540E8",
  primaryDeep: "#1A1330",
  primarySoft: "#A58BFF",

  bg: "#0B0B0F",
  bgSecondary: "#14141A",
  bgPanel: "#1B1B23",
  bgHover: "rgba(255,255,255,0.06)",
  bgActive: "rgba(255,255,255,0.1)",
  bgBubbleIn: "#1F1F29",
  bgBubbleOut: "#7C4DFF",
  bgInput: "#20202A",
  bgModal: "#111116",
  bgDarkRaised: "#17171D",
  bgStatusCard: "#1C1C27",

  text: "#FFFFFF",
  textSecondary: "#B8B8C2",
  textMuted: "#7B7B87",
  textPlaceholder: "#8C8C98",
  textHeader: "#FFFFFF",

  online: "#25D366",
  readReceipt: "#61C7FF",
  danger: "#FF5D7A",
  warning: "#FBBF24",
  link: "#8E7BFF",
  star: "#F8D66A",
  textLink: "#A78BFA",
  border: "rgba(255,255,255,0.06)",
  borderLight: "rgba(255,255,255,0.12)",
  white: "#FFFFFF",
  black: "#000000",

  bubbleOutLight: "#D9FDD3",
  bubbleInLight: "#FFFFFF",

  tabBarBg: "rgba(20, 20, 26, 0.82)",
  tabBarBorder: "rgba(255,255,255,0.12)",
  tabBarSelected: "rgba(124, 77, 255, 0.24)",

  fabBg: "rgba(23, 23, 31, 0.94)",
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

