import { useEffect, useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AppState {
  themeMode: "dark" | "light";
  hasSeenOnboarding: boolean;
}

const appStoreKey = "wavy-app-store";
let appState: AppState = {
  themeMode: "dark",
  hasSeenOnboarding: false,
};
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function setAppState(partial: Partial<AppState>) {
  appState = { ...appState, ...partial };
  notify();
}

export async function bootstrapAppStore() {
  try {
    const raw = await AsyncStorage.getItem(appStoreKey);
    if (!raw) return;
    const parsed = JSON.parse(raw) as AppState;
    appState = { ...appState, ...parsed };
    notify();
  } catch (error) {
    console.error("Failed to bootstrap app store", error);
  }
}

export function setThemeMode(mode: AppState["themeMode"]) {
  setAppState({ themeMode: mode });
  AsyncStorage.setItem(appStoreKey, JSON.stringify(appState)).catch(() => {});
}

export function setHasSeenOnboarding(value: boolean) {
  setAppState({ hasSeenOnboarding: value });
  AsyncStorage.setItem(appStoreKey, JSON.stringify(appState)).catch(() => {});
}

export function useAppStore<T>(selector: (state: AppState) => T): T {
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return useSyncExternalStore(subscribe, () => selector(appState), () => selector(appState));
}
