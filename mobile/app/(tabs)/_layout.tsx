import React from "react";
import { Tabs } from "expo-router";
import { StyleSheet, View, Text, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { Colors } from "@/constants/theme";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const TABS: {
  name: string;
  label: string;
  icon: IconName;
  iconOutline: IconName;
}[] = [
  { name: "status", label: "Updates", icon: "circle-double", iconOutline: "circle-outline" },
  { name: "calls", label: "Calls", icon: "phone", iconOutline: "phone-outline" },
  { name: "communities", label: "Communities", icon: "account-group", iconOutline: "account-group-outline" },
  { name: "chats", label: "Chats", icon: "chat", iconOutline: "chat-outline" },
  { name: "settings", label: "Settings", icon: "cog", iconOutline: "cog-outline" },
];

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.fabContainer, { bottom: insets.bottom + 10 }]}
    >
      <BlurView intensity={50} tint="dark" style={styles.tabBarBlur}>
        <View style={styles.tabBarInner}>
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const tab = TABS.find((t) => t.name === route.name) ?? TABS[3];
            const iconName = isFocused ? tab.icon : tab.iconOutline;
            const iconColor = isFocused ? Colors.text : Colors.textSecondary;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                style={({ pressed }) => [
                  styles.tabItem,
                  isFocused && styles.tabItemFocused,
                  pressed && styles.tabItemPressed,
                ]}
              >
                <MaterialCommunityIcons name={iconName} size={24} color={iconColor} />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isFocused ? Colors.text : Colors.textSecondary },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="chats"
      screenOptions={{
        headerShown: false,
        animation: "fade",
        tabBarActiveTintColor: Colors.text,
        tabBarInactiveTintColor: Colors.textSecondary,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="status" options={{ title: "Updates" }} />
      <Tabs.Screen name="calls" options={{ title: "Calls" }} />
      <Tabs.Screen name="communities" options={{ title: "Communities" }} />
      <Tabs.Screen name="chats" options={{ title: "Chats" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    shadowColor: Colors.fabShadow,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  tabBarBlur: {
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.tabBarBorder,
    backgroundColor: Colors.tabBarBg,
    overflow: "hidden",
  },
  tabBarInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 18,
    minWidth: 54,
  },
  tabItemFocused: {
    backgroundColor: Colors.tabBarSelected,
  },
  tabItemPressed: {
    opacity: 0.7,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 3,
  },
});
