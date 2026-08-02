import React, { useEffect, useState } from "react";
import { Provider, useSelector } from "react-redux";
import { ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import { ActivityIndicator, View } from "react-native";

import "react-native-reanimated";

import { store, loadPersistedAuth, RootState } from "@/redux/store";
import { darkTheme, Colors } from "@/constants/theme";
import { disconnectSocket } from "@/utils/socket";

function RootNavigator() {
  const { isAuthenticated, hydrated } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/login");
    } else if (hydrated && isAuthenticated) {
      router.replace("/(tabs)");
    }
  }, [hydrated, isAuthenticated]);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bg },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="chat"
        options={{
          presentation: "card",
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="profile-share"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadPersistedAuth().finally(() => setReady(true));
    return () => {
      disconnectSocket();
    };
  }, []);

  return (
    <Provider store={store}>
      <ThemeProvider value={darkTheme}>
        <StatusBar style="light" />
        {ready ? <RootNavigator /> : null}
        <Toast />
      </ThemeProvider>
    </Provider>
  );
}

