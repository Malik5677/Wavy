import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useSelector } from "react-redux";

import { RootState } from "@/redux/store";
import { API_URL } from "@/utils/api";
import { Colors } from "@/constants/theme";

export default function CommunitiesScreen() {
  const { token } = useSelector((state: RootState) => state.auth);
  const [communities, setCommunities] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchCommunities = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/community`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCommunities(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  const handleCreateCommunity = async () => {
    if (!name.trim()) {
      Toast.show({ type: "error", text1: "Community name is required" });
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/community`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, description, avatar: "", groupNames: [] }),
      });
      if (!res.ok) {
        throw new Error("Failed to create community");
      }
      setShowCreate(false);
      setName("");
      setDescription("");
      Toast.show({ type: "success", text1: "Community created" });
      fetchCommunities();
    } catch {
      Toast.show({ type: "error", text1: "Failed to create community" });
    } finally {
      setCreating(false);
    }
  };

  const filteredCommunities = communities.filter((community) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return `${community.name} ${community.description || ""}`.toLowerCase().includes(query);
  });

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Communities</Text>
        <TouchableOpacity style={styles.createButton} onPress={() => setShowCreate(true)}>
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 60 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <View style={styles.searchShell}>
            <MaterialCommunityIcons name="magnify" size={18} color={Colors.textSecondary} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search communities"
              placeholderTextColor={Colors.textSecondary}
              style={styles.searchInput}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <MaterialCommunityIcons name="close" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>

          {filteredCommunities.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <MaterialCommunityIcons name="account-group-outline" size={44} color={Colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No communities yet</Text>
              <Text style={styles.emptySub}>
                Create a community to bring your groups and chats together in one place.
              </Text>
            </View>
          ) : (
            filteredCommunities.map((community) => (
              <View key={community.id} style={styles.communityCard}>
                <View style={styles.communityHeader}>
                  <View style={styles.communityIcon}>
                    <MaterialCommunityIcons name="account-group" size={24} color="#fff" />
                  </View>
                  <View style={styles.communityInfo}>
                    <Text style={styles.communityName}>{community.name}</Text>
                    <Text style={styles.communityMeta}>
                      {community.membersCount || 0} members • {community.groups?.length || 0} groups
                    </Text>
                  </View>
                  <View style={styles.communityBadge}>
                    <Text style={styles.communityBadgeText}>Active</Text>
                  </View>
                </View>
                {community.description ? (
                  <Text style={styles.communityDescription}>{community.description}</Text>
                ) : null}
                <View style={styles.communityFooter}>
                  <TouchableOpacity style={styles.communityAction}>
                    <MaterialCommunityIcons name="message-outline" size={18} color={Colors.text} />
                    <Text style={styles.communityActionText}>Open</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.communityAction}>
                    <MaterialCommunityIcons name="share-outline" size={18} color={Colors.primary} />
                    <Text style={[styles.communityActionText, { color: Colors.primary }]}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <Modal visible={showCreate} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Community</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <MaterialCommunityIcons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Community name"
              placeholderTextColor={Colors.textSecondary}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={[styles.input, { minHeight: 92, textAlignVertical: "top" }]}
              placeholder="Description"
              placeholderTextColor={Colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleCreateCommunity} disabled={creating}>
              <Text style={styles.saveButtonText}>{creating ? "Creating..." : "Create Community"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "700",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOpacity: 0.32,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  searchShell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: Colors.bgPanel,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
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
  communityCard: {
    backgroundColor: Colors.bgPanel,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  communityHeader: { flexDirection: "row", alignItems: "center" },
  communityIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  communityInfo: { flex: 1 },
  communityName: { fontSize: 18, fontWeight: "700", color: Colors.text },
  communityMeta: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  communityBadge: {
    backgroundColor: "rgba(124, 77, 255, 0.18)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  communityBadgeText: { color: Colors.primary, fontSize: 11, fontWeight: "700" },
  communityDescription: { fontSize: 14, color: Colors.textSecondary, marginTop: 12, lineHeight: 20 },
  communityFooter: {
    flexDirection: "row",
    marginTop: 14,
    gap: 10,
  },
  communityAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.bgInput,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  communityActionText: { color: Colors.text, fontSize: 12, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.bgModal,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 19, fontWeight: "700", color: Colors.text },
  input: {
    backgroundColor: Colors.bgInput,
    borderRadius: 14,
    padding: 14,
    color: Colors.text,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
