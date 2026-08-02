import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/theme";

export default function CommunitiesScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Communities</Text>
      </View>

      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <MaterialCommunityIcons name="account-group-outline" size={44} color={Colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>No communities yet</Text>
        <Text style={styles.emptySub}>
          Create a community to bring your groups and chats together in one place.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    backgroundColor: Colors.bg,
    paddingHorizontal: 16,
    paddingTop: Platform.select({ ios: 12, android: 8 }),
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "700",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  emptyContainer: { alignItems: "center", marginTop: 120, paddingHorizontal: 40 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.bgPanel,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: Colors.text, marginBottom: 8 },
  emptySub: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
