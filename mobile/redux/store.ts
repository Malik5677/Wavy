import { configureStore } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import authReducer, { hydrate } from "./authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

export async function loadPersistedAuth() {
  try {
    const token = await AsyncStorage.getItem("token");
    const userStr = await AsyncStorage.getItem("user");
    if (token) {
      const user = userStr ? JSON.parse(userStr) : null;
      store.dispatch(hydrate({ user, token }));
    } else {
      store.dispatch(hydrate({ user: null, token: null }));
    }
  } catch (e) {
    console.error("Failed to load persisted auth:", e);
    store.dispatch(hydrate({ user: null, token: null }));
  }
}

export async function persistAuth(token: string | null, user: any | null) {
  try {
    if (token) {
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("user", JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
    }
  } catch (e) {
    console.error("Failed to persist auth:", e);
  }
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
