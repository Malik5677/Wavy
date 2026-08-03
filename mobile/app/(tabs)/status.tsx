import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSelector } from "react-redux";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";

import { RootState } from "@/redux/store";
import { API_URL } from "@/utils/api";
import { Colors } from "@/constants/theme";
import Avatar from "@/components/Avatar";

export default function StatusScreen() {
  const { token, user } = useSelector((state: RootState) => state.auth);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newStatusText, setNewStatusText] = useState("");
  const [statusType, setStatusType] = useState("text");
  const [viewingStatus, setViewingStatus] = useState<any>(null);

  const fetchStatuses = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStatuses(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const handleCreateStatus = async () => {
    if (!newStatusText.trim()) {
      Toast.show({ type: "error", text1: "Content is required" });
      return;
    }
    await Haptics.selectionAsync();
    try {
      const res = await fetch(`${API_URL}/api/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: newStatusText, type: statusType }),
      });
      if (res.ok) {
        Toast.show({ type: "success", text1: "Status updated!" });
        setShowCreate(false);
        setNewStatusText("");
        setStatusType("text");
        void fetchStatuses();
      }
    } catch {
      Toast.show({ type: "error", text1: "Failed to create status" });
    }
  };

  const renderStatus = ({ item }: { item: any }) => {
    const lastStatus = item.statuses?.[item.statuses.length - 1];
    if (!lastStatus) return null;
    const isMe = item.user.id === user?.id;

    return (
      <TouchableOpacity
        style={styles.statusCard}
        onPress={async () => {
          await Haptics.selectionAsync();
          setViewingStatus(item);
        }}
        activeOpacity={0.9}
      >
        <View style={styles.statusAvatarWrap}>
          <Avatar
            name={item.user.displayName || item.user.username || "?"}
            photo={item.user.profilePhoto}
            size={64}
            online={false}
          />
          {isMe && (
            <View style={styles.myStatusBadge}>
              <MaterialCommunityIcons name="plus" size={14} color="#fff" />
            </View>
          )}
        </View>
        <Text style={styles.statusName} numberOfLines={1}>
          {isMe ? "My status" : (item.user.displayName || item.user.username || "Unknown")}
        </Text>
        <Text style={styles.statusTime}>
          {new Date(lastStatus.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Status</Text>
      </View>

      <FlatList
        data={statuses}
        keyExtractor={(item) => item.user.id}
        renderItem={renderStatus}
        numColumns={2}
        contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
        ListHeaderComponent={
          <TouchableOpacity style={styles.myStatusBtn} onPress={() => setShowCreate(true)}>
            <View style={styles.myStatusAvatarWrap}>
              <Avatar
                name={user?.displayName || user?.username || "M"}
                photo={user?.profilePhoto}
                size={60}
                online={false}
              />
              <View style={styles.addBadge}>
                <MaterialCommunityIcons name="plus" size={16} color="#fff" />
              </View>
            </View>
            <View style={styles.myStatusInfo}>
              <Text style={styles.myStatusLabel}>My status</Text>
              <Text style={styles.myStatusHint}>Tap to add a status update</Text>
            </View>
            <MaterialCommunityIcons name="dots-horizontal" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 60 }} />
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="camera" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>No status updates</Text>
              <Text style={styles.emptySub}>Tap above to share a moment with your contacts.</Text>
            </View>
          )
        }
      />

      {/* Create Status Modal */}
      <Modal visible={showCreate} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Status</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <MaterialCommunityIcons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              <View style={styles.typeRow}>
                {["text", "link"].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeChip, statusType === t && styles.typeChipActive]}
                    onPress={() => setStatusType(t)}
                  >
                    <Text style={[styles.typeChipText, statusType === t && styles.typeChipTextActive]}>
                      {t === "text" ? "Text" : "Link"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.statusInput}
                placeholder={statusType === "link" ? "Paste a URL..." : "What's on your mind?"}
                placeholderTextColor={Colors.textSecondary}
                value={newStatusText}
                onChangeText={setNewStatusText}
                multiline
              />
            </ScrollView>
            <TouchableOpacity style={styles.postBtn} onPress={handleCreateStatus}>
              <Text style={styles.postBtnText}>Post Status</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* View Status Modal */}
      <Modal visible={!!viewingStatus} transparent animationType="fade">
        <View style={styles.viewerOverlay}>
          <View style={styles.viewerHeader}>
            <Text style={styles.viewerName}>
              {viewingStatus?.user?.displayName || viewingStatus?.userName || "Status"}
            </Text>
            <TouchableOpacity onPress={() => setViewingStatus(null)}>
              <MaterialCommunityIcons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={{ flex: 1 }}
          >
            {viewingStatus?.statuses?.map((s: any) => (
              <View key={s.id} style={styles.statusSlide}>
                {s.type === "text" || s.type === "link" ? (
                  <Text style={styles.statusSlideText}>{s.content}</Text>
                ) : (
                  <Image source={{ uri: s.content }} style={styles.statusSlideImage} />
                )}
                <Text style={styles.statusSlideTime}>
                  {new Date(s.createdAt).toLocaleString()}
                </Text>
              </View>
            ))}
          </ScrollView>
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
  },
  headerTitle: { fontSize: 34, fontWeight: "700", color: Colors.text, letterSpacing: -0.5 },
  myStatusBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgPanel,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  myStatusAvatarWrap: { position: "relative", marginRight: 14 },
  addBadge: {
    position: "absolute",
    bottom: 0,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.bg,
  },
  myStatusInfo: { flex: 1 },
  myStatusLabel: { fontSize: 16, fontWeight: "600", color: Colors.text },
  myStatusHint: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  statusCard: {
    flex: 1,
    backgroundColor: Colors.bgPanel,
    borderRadius: 20,
    padding: 12,
    margin: 4,
    alignItems: "center",
    maxWidth: "48%",
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  statusAvatarWrap: { position: "relative", marginBottom: 8 },
  myStatusBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  statusName: { fontSize: 14, fontWeight: "600", color: Colors.text, textAlign: "center" },
  statusTime: { fontSize: 11, color: Colors.textSecondary, marginTop: 4, textAlign: "center" },
  emptyContainer: { alignItems: "center", marginTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: Colors.text, marginTop: 16, marginBottom: 6 },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: "center", lineHeight: 20 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.bgPanel,
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
  typeRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.bgHover,
  },
  typeChipActive: { backgroundColor: Colors.primary },
  typeChipText: { fontSize: 14, color: Colors.textSecondary },
  typeChipTextActive: { color: "#fff", fontWeight: "600" },
  statusInput: {
    backgroundColor: Colors.bgInput,
    borderRadius: 12,
    padding: 14,
    color: Colors.text,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: "top",
  },
  postBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 16,
  },
  postBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  viewerOverlay: {
    flex: 1,
    backgroundColor: "#000",
  },
  viewerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
  },
  viewerName: { fontSize: 18, fontWeight: "700", color: "#fff" },
  statusSlide: {
    width: 375,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  statusSlideText: { color: "#fff", fontSize: 22, textAlign: "center", lineHeight: 32 },
  statusSlideImage: { width: "100%", height: 400, borderRadius: 12 },
  statusSlideTime: { color: "#aaa", fontSize: 13, marginTop: 16 },
});