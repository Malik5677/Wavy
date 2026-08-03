import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useSelector } from "react-redux";

import { RootState } from "@/redux/store";
import { API_URL } from "@/utils/api";
import Avatar from "@/components/Avatar";
import { Colors } from "@/constants/theme";

export default function ProfileShareScreen() {
  const { shareId } = useLocalSearchParams<{ shareId?: string }>();
  const { token, user } = useSelector((state: RootState) => state.auth);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const targetId = shareId || user?.id;
      if (!targetId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/user/share/${targetId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error("Unable to load profile");
        const data = await res.json();
        setProfile(data);
      } catch {
        Toast.show({ type: "error", text1: "Could not load profile" });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [shareId, token, user?.id]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Profile unavailable</Text>
        <Text style={styles.subtitle}>This profile cannot be loaded right now.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.card}>
        <View style={styles.topRow}>
          <Avatar name={profile.displayName || profile.username || "User"} photo={profile.profilePhoto} size={92} />
          <View style={styles.topInfo}>
            <Text style={styles.title}>{profile.displayName || profile.username || "WaveChat User"}</Text>
            <Text style={styles.subtitle}>@{profile.username || profile.phoneNumber || "wavechat-user"}</Text>
          </View>
        </View>

        <View style={styles.metaCard}>
          <MaterialCommunityIcons name="phone-outline" size={18} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{profile.phoneNumber || "Private number"}</Text>
        </View>
        <View style={styles.metaCard}>
          <MaterialCommunityIcons name="information-outline" size={18} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{profile.bio || "No bio yet"}</Text>
        </View>

        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <MaterialCommunityIcons name="circle" size={14} color={profile.isOnline ? Colors.online : Colors.textSecondary} />
            <Text style={styles.badgeText}>{profile.isOnline ? "Online" : "Offline"}</Text>
          </View>
          <View style={styles.badge}>
            <MaterialCommunityIcons name="shield-check" size={14} color={Colors.primary} />
            <Text style={styles.badgeText}>Private profile</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Text style={styles.actionButton} onPress={() => router.replace("/(tabs)/chats")}>
            Back to chats
          </Text>
          <Text style={styles.actionButtonSecondary} onPress={() => Toast.show({ type: "info", text1: "Share profile is ready" })}>
            Share profile
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  scroll: {
    flexGrow: 1,
    backgroundColor: Colors.bg,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: Colors.bgPanel,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  topInfo: {
    marginLeft: 16,
    flex: 1,
  },
  title: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  metaCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.bgInput,
    padding: 14,
    borderRadius: 16,
    marginTop: 14,
  },
  metaText: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
    flexWrap: "wrap",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.bgInput,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  badgeText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
    flexWrap: "wrap",
  },
  actionButton: {
    color: Colors.primary,
    fontWeight: "700",
    backgroundColor: "rgba(124, 77, 255, 0.16)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionButtonSecondary: {
    color: Colors.text,
    fontWeight: "700",
    backgroundColor: Colors.bgInput,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});