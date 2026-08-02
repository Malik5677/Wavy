import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSelector } from "react-redux";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { RootState } from "@/redux/store";
import { API_URL } from "@/utils/api";
import { Colors } from "@/constants/theme";
import Avatar from "@/components/Avatar";

export default function CallsScreen() {
  const { token } = useSelector((state: RootState) => state.auth);
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCalls = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/call`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const data = await res.json();
        setCalls(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  const renderCall = ({ item }: { item: any }) => {
    const isMissed = item.status === "missed" && item.isIncoming;
    const isOutgoing = !item.isIncoming;

    return (
      <TouchableOpacity style={styles.callRow}>
        <Avatar
          name={item.otherUser?.displayName || item.otherUser?.phoneNumber || "?"}
          photo={item.otherUser?.profilePhoto}
          size={56}
          online={false}
        />
        <View style={styles.callInfo}>
          <Text style={[styles.callName, isMissed && { color: Colors.danger }]}>
            {item.otherUser?.displayName || item.otherUser?.phoneNumber || "Unknown"}
          </Text>
          <View style={styles.callMeta}>
            <MaterialCommunityIcons
              name={isOutgoing ? "phone-outgoing" : isMissed ? "phone-missed" : "phone-incoming"}
              size={14}
              color={isMissed ? Colors.danger : Colors.primary}
            />
            <Text style={styles.callTime}>
              {new Date(item.startedAt).toLocaleString([], {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </Text>
          </View>
        </View>
        <MaterialCommunityIcons
          name={item.type === "video" ? "video" : "phone"}
          size={22}
          color={Colors.primary}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calls</Text>
      </View>

      <FlatList
        data={calls}
        keyExtractor={(item) => item.id}
        renderItem={renderCall}
        contentContainerStyle={{ paddingVertical: 8 }}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 60 }} />
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <MaterialCommunityIcons name="phone-outline" size={36} color={Colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No calls yet</Text>
              <Text style={styles.emptySub}>
                Start a call from any chat by tapping the phone or video icon.
              </Text>
            </View>
          )
        }
      />

      <Toast />
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
  headerTitle: { fontSize: 34, fontWeight: "700", color: Colors.text, letterSpacing: -0.5 },
  callRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  callInfo: { flex: 1, marginLeft: 12 },
  callName: { fontSize: 17, fontWeight: "600", color: Colors.text },
  callMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  callTime: { fontSize: 13, color: Colors.textSecondary },
  emptyContainer: { alignItems: "center", marginTop: 80, paddingHorizontal: 40 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.bgPanel,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: Colors.text, marginBottom: 6 },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: "center", lineHeight: 20 },
});