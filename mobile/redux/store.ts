import { configureStore } from "@reduxjs/toolkit";
import authReducer, { hydrate, User } from "./authSlice";
import { secureStorage } from "@/lib/storage";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

export async function loadPersistedAuth() {
  try {
    const token = await secureStorage.get("wavy_token");
    const userStr = await secureStorage.get("wavy_user");
    if (token) {
      const user = userStr ? (JSON.parse(userStr) as User | null) : null;
      store.dispatch(hydrate({ user, token }));
    } else {
      store.dispatch(hydrate({ user: null, token: null }));
    }
  } catch (e) {
    console.error("Failed to load persisted auth:", e);
    store.dispatch(hydrate({ user: null, token: null }));
  }
}

export async function persistAuth(token: string | null, user: User | null) {
  try {
    if (token) {
      await secureStorage.set("wavy_token", token);
      await secureStorage.set("wavy_user", JSON.stringify(user));
    } else {
      await secureStorage.remove("wavy_token");
      await secureStorage.remove("wavy_user");
    }
  } catch (e) {
    console.error("Failed to persist auth:", e);
  }
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
