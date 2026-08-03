import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Modal,
  Platform,
  Animated,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";

import { RootState } from "@/redux/store";
import { logout } from "@/redux/authSlice";
import { API_URL } from "@/utils/api";
import { getSocket, disconnectSocket } from "@/utils/socket";
import { chatListTime, lastMessagePreview } from "@/utils/helpers";
import Avatar from "@/components/Avatar";
import { Colors } from "@/constants/theme";

function FabButton({
  icon,
  size,
  color,
  backgroundColor,
  onPress,
  label,
  delay = 0,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  size: number;
  color: string;
  backgroundColor: string;
  onPress: () => void;
  label?: string;
  delay?: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.6)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.spring(opacity, {
      toValue: 1,
      useNativeDriver: true,
      delay,
      damping: 18,
      stiffness: 160,
    }).start();
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      delay,
      damping: 14,
      stiffness: 200,
    }).start();
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      delay,
      damping: 16,
      stiffness: 180,
    }).start();
  }, [opacity, scale, translateY, delay]);

  const pressScale = useRef(new Animated.Value(1)).current;

  const animateIn = () => {
    Animated.timing(pressScale, {
      toValue: 0.88,
      duration: 110,
      useNativeDriver: true,
    }).start();
  };

  const animateOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 12,
      stiffness: 220,
    }).start();
  };

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ scale: pressScale }, { translateY }],
      }}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPressIn={animateIn}
          onPressOut={animateOut}
          onPress={onPress}
          accessibilityLabel={label}
          style={[
            styles.fabBase,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor,
              shadowColor: Colors.fabShadow,
              shadowOpacity: 0.45,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
              elevation: 8,
            },
          ]}
        >
          <MaterialCommunityIcons name={icon} size={size * 0.46} color={color} />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

export default function ChatsScreen() {
  const { token, user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const [chats, setChats] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savedContacts, setSavedContacts] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});

  const socketRef = useRef<any>(null);

  const getUserDisplayInfo = useCallback(
    (u: any) => {
      if (!u) return { name: "?", photo: "", isSaved: false };
      const saved = savedContacts.find((c) => c.contactId === (u.id || u.userId));
      const isSaved = !!saved;
      const name = saved ? saved.customName : u.displayName || u.username || u.phoneNumber || "?";
      return { name, photo: u.profilePhoto, isSaved };
    },
    [savedContacts]
  );

  const fetchChats = useCallback(async () => {
    if (!token) return null;
    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const data = await res.json();
        setChats(data);
        return data;
      }
    } catch (err) {
      console.error("Error fetching chats:", err);
    }
    return null;
  }, [token]);

  const fetchContacts = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/user/contacts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSavedContacts(data);
      }
    } catch {
      // Keep contacts list resilient if the endpoint is unavailable.
    }
  }, [token]);

  const searchUsers = async (q: string) => {
    setSearchQuery(q);
    if (!q) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/chat/search-users?q=${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch {
      Toast.show({ type: "error", text1: "Search failed" });
    }
  };

  const startChat = async (recipientId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/chat/start`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId }),
      });
      if (res.ok) {
        const data = await res.json();
        setSearchQuery("");
        setSearchResults([]);
        const updated = await fetchChats();
        const opened = updated?.find((c: any) => c.chatId === data.chatId);
        router.push({
          pathname: "/chat",
          params: { chatId: data.chatId, name: opened?.name || "Chat" },
        });
      }
    } catch {
      Toast.show({ type: "error", text1: "Could not start chat" });
    }
  };

  const handleLogout = async () => {
    await Haptics.selectionAsync();
    disconnectSocket();
    dispatch(logout());
    router.replace("/login");
  };

  useEffect(() => {
    fetchChats().finally(() => setLoading(false));
    fetchContacts();
  }, [fetchChats, fetchContacts]);

  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);
    socketRef.current = socket;
    if (!socket) return;

    socket.on("receive_message", () => fetchChats());
    socket.on("message_deleted", () => fetchChats());
    socket.on("message_edited", () => fetchChats());
    socket.on("user_status", ({ userId, isOnline }: { userId: string; isOnline: boolean }) => {
      setChats((prev) =>
        prev.map((c) =>
          c.otherUser?.id === userId
            ? { ...c, otherUser: { ...c.otherUser, isOnline } }
            : c
        )
      );
    });
    socket.on("typing", ({ chatId, userId: uid }: { chatId: string; userId: string }) => {
      if (uid !== user?.id) setTypingUsers((prev) => ({ ...prev, [uid]: true }));
    });
    socket.on("stop_typing", ({ userId: uid }: { userId: string }) => {
      setTypingUsers((prev) => ({ ...prev, [uid]: false }));
    });

    return () => {
      socket.off("receive_message");
      socket.off("message_deleted");
      socket.off("message_edited");
      socket.off("user_status");
      socket.off("typing");
      socket.off("stop_typing");
    };
  }, [token, user?.id, fetchChats]);

  const renderChat = ({ item: chat }: { item: any }) => {
    const name = !chat.isGroup && chat.otherUser
      ? getUserDisplayInfo(chat.otherUser).name
      : chat.name || "Unknown";
    const photo = !chat.isGroup && chat.otherUser
      ? getUserDisplayInfo(chat.otherUser).photo
      : chat.avatar;
    const isTyping = chat.otherUser && typingUsers[chat.otherUser.id];
    const lastMsg = chat.lastMessage;
    const time = lastMsg ? chatListTime(lastMsg.createdAt) : "";
    const preview = lastMsg ? lastMessagePreview(lastMsg) : "No messages yet";
    const unreadCount = chat.unreadCount || 0;
    const isPinned = chat.isPinned || false;
    const isMuted = chat.isMuted || false;

    return (
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/chat",
            params: {
              chatId: chat.chatId,
              name,
              isGroup: chat.isGroup ? "1" : "0",
              photo: photo || "",
            },
          })
        }
        style={({ pressed }) => [styles.chatRow, pressed && styles.chatRowPressed]}
      >
        <Avatar
          name={name}
          photo={photo}
          size={56}
          group={chat.isGroup}
          online={chat.otherUser?.isOnline}
          verified={Boolean(chat.otherUser?.isVerified || chat.isVerified)}
        />
        <View style={styles.chatInfo}>
          <View style={styles.chatTopRow}>
            <Text style={styles.chatName} numberOfLines={1}>
              {name}
            </Text>
            {chat.otherUser?.isVerified || chat.isVerified ? (
              <MaterialCommunityIcons name="check-decagram" size={14} color={Colors.primary} style={styles.verifiedIcon} />
            ) : null}
            <View style={styles.chatTopRight}>
              {time ? <Text style={styles.chatTime}>{time}</Text> : null}
              {isPinned ? (
                <MaterialCommunityIcons
                  name="pin"
                  size={14}
                  color={Colors.textSecondary}
                  style={styles.pinIcon}
                />
              ) : null}
            </View>
          </View>
          <View style={styles.chatBottomRow}>
            {isTyping ? (
              <Text style={styles.typingText} numberOfLines={1}>
                typing...
              </Text>
            ) : (
              <View style={styles.chatPreviewWrap}>
                {isMuted ? (
                  <MaterialCommunityIcons
                    name="volume-off"
                    size={13}
                    color={Colors.textSecondary}
                    style={styles.muteIcon}
                  />
                ) : null}
                <Text style={styles.chatPreview} numberOfLines={1}>
                  {chat.isGroup && lastMsg
                    ? `${
                        lastMsg.senderId === user?.id
                          ? "You: "
                          : lastMsg.sender?.name
                          ? `${lastMsg.sender.name}: `
                          : ""
                      }`
                    : ""}
                  {preview}
                </Text>
              </View>
            )}
            {unreadCount > 0 ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    );
  };

  const filteredChats = showArchived
    ? chats.filter((c) => c.isArchived)
    : chats.filter((c) => !c.isArchived);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={async () => {
              await Haptics.selectionAsync();
              setMenuOpen(!menuOpen);
            }}
            style={styles.moreButton}
            accessibilityLabel="More options"
          >
            <MaterialCommunityIcons name="dots-horizontal" size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chats</Text>
          <TouchableOpacity
            onPress={async () => {
              await Haptics.selectionAsync();
              Toast.show({ type: "info", text1: "Camera shortcut" });
            }}
            style={styles.cameraButton}
            accessibilityLabel="Camera"
          >
            <MaterialCommunityIcons name="camera-outline" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchShell}>
          <MaterialCommunityIcons name="magnify" size={18} color={Colors.textSecondary} />
          <TextInput
            value={searchQuery}
            onChangeText={searchUsers}
            placeholder="Search chats or contacts"
            placeholderTextColor={Colors.textSecondary}
            style={styles.searchInput}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}> 
              <MaterialCommunityIcons name="close" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <Modal visible={menuOpen} transparent animationType="fade">
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
          <View style={styles.menu}>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setShowArchived((v) => !v);
                setMenuOpen(false);
              }}
            >
              <MaterialCommunityIcons name="archive" size={20} color={Colors.text} />
              <Text style={styles.menuText}>{showArchived ? "Unarchive view" : "Archived"}</Text>
            </Pressable>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                router.push({ pathname: "/(tabs)/settings" as any });
              }}
            >
              <MaterialCommunityIcons name="cog-outline" size={20} color={Colors.text} />
              <Text style={styles.menuText}>Settings</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={handleLogout}>
              <MaterialCommunityIcons name="logout" size={20} color={Colors.danger} />
              <Text style={[styles.menuText, { color: Colors.danger }]}>Log out</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {searchQuery ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <Text style={styles.sectionLabel}>CONTACTS ON WAVECHAT</Text>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.contactRow} onPress={() => startChat(item.id)}>
              <Avatar name={getUserDisplayInfo(item).name} photo={item.profilePhoto} size={48} />
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{getUserDisplayInfo(item).name}</Text>
                <Text style={styles.contactBio} numberOfLines={1}>
                  {item.bio || "Hey there! I am using WaveChat."}
                </Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No results found for &quot;{searchQuery}&quot;</Text>
          }
          contentContainerStyle={{ paddingBottom: 180 }}
        />
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.chatId}
          renderItem={renderChat}
          contentContainerStyle={{ paddingBottom: 180 }}
          ItemSeparatorComponent={() => <View style={styles.rowSeparator} />}
          ListHeaderComponent={
            !showArchived
              ? () => (
                  <Pressable
                    style={({ pressed }) => [styles.archivedRow, pressed && styles.chatRowPressed]}
                    onPress={() => setShowArchived(true)}
                  >
                    <MaterialCommunityIcons name="archive" size={22} color={Colors.textSecondary} />
                    <Text style={styles.archivedText}>Archived</Text>
                    <View style={styles.archivedSeparator} />
                  </Pressable>
                )
              : null
          }
          ListEmptyComponent={
            loading ? null : (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIcon}>
                  <MaterialCommunityIcons name="chat-outline" size={40} color={Colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>Your messages</Text>
                <Text style={styles.emptySub}>
                  Send private messages to your friends and keep the conversation going.
                </Text>
              </View>
            )
          }
        />
      )}

      <View style={styles.fabStack} pointerEvents="box-none">
        <FabButton
          icon="cash"
          size={44}
          color={Colors.text}
          backgroundColor={Colors.fabBg}
          onPress={() => Toast.show({ type: "info", text1: "Payments coming soon" })}
          label="Payments"
          delay={120}
        />
        <FabButton
          icon="camera-outline"
          size={44}
          color={Colors.text}
          backgroundColor={Colors.fabBg}
          onPress={() => Toast.show({ type: "info", text1: "Camera coming soon" })}
          label="Camera"
          delay={60}
        />
        <FabButton
          icon="plus"
          size={56}
          color="#fff"
          backgroundColor={Colors.primary}
          onPress={() => router.push({ pathname: "/chat", params: { newChat: "1" } })}
          label="New chat"
          delay={0}
        />
      </View>

      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    backgroundColor: Colors.bg,
    paddingHorizontal: 12,
    paddingTop: Platform.select({ ios: 8, android: 8 }),
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgPanel,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  cameraButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgPanel,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "700",
    color: Colors.text,
    letterSpacing: -0.5,
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
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
  },
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chatRowPressed: {
    backgroundColor: Colors.bgHover,
  },
  rowSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginLeft: 84,
  },
  chatInfo: { flex: 1, marginLeft: 12 },
  chatTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chatName: { fontSize: 17, fontWeight: "600", color: Colors.text, flexShrink: 1 },
  verifiedIcon: { marginLeft: 4, marginRight: 6 },
  chatTopRight: { flexDirection: "row", alignItems: "center", marginLeft: 8 },
  chatTime: { fontSize: 13, color: Colors.textSecondary },
  pinIcon: { marginLeft: 4 },
  chatBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  chatPreviewWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  typingText: { fontSize: 14, color: Colors.primary, fontWeight: "500", flex: 1 },
  chatPreview: { fontSize: 14, color: Colors.textSecondary, flexShrink: 1 },
  muteIcon: { marginRight: 4 },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 11,
    minWidth: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadBadgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  fabStack: {
    position: "absolute",
    right: 18,
    bottom: 130,
    alignItems: "center",
    gap: 12,
  },
  fabBase: {
    alignItems: "center",
    justifyContent: "center",
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    paddingTop: 72,
    paddingLeft: 16,
  },
  menu: {
    backgroundColor: Colors.bgPanel,
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 180,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
  },
  menuText: { fontSize: 15, color: Colors.text, fontWeight: "500" },
  sectionLabel: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  contactInfo: { flex: 1, marginLeft: 12 },
  contactName: { fontSize: 16, fontWeight: "500", color: Colors.text },
  contactBio: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  emptyText: {
    textAlign: "center",
    color: Colors.textSecondary,
    marginTop: 40,
    fontSize: 14,
  },
  archivedRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  archivedSeparator: {
    position: "absolute",
    left: 84,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
  },
  archivedText: { fontSize: 15, fontWeight: "500", color: Colors.textSecondary },
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

