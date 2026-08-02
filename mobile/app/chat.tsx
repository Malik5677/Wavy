import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
  Modal,
  Alert,
  Image,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSelector } from "react-redux";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { RootState } from "@/redux/store";
import { API_URL } from "@/utils/api";
import { getSocket } from "@/utils/socket";
import { lastMessagePreview, formatDuration } from "@/utils/helpers";
import Avatar from "@/components/Avatar";
import { Colors } from "@/constants/theme";

export default function ChatScreen() {
  const { chatId, name, isGroup, photo, newChat } = useLocalSearchParams<{
    chatId?: string;
    name?: string;
    isGroup?: string;
    photo?: string;
    newChat?: string;
  }>();
  const { token, user } = useSelector((state: RootState) => state.auth);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [chatSearch, setChatSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [contactInfo, setContactInfo] = useState(false);
  const [contextMenu, setContextMenu] = useState<any>(null);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [savedContacts, setSavedContacts] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [activeChat, setActiveChat] = useState<any>(null);

  const flatListRef = useRef<FlatList>(null);
  const typingRef = useRef<any>(null);
  const recordingRef = useRef<any>(null);

  const fetchMessages = useCallback(
    async (offset = 0) => {
      if (!chatId || !token) return;
      try {
        const res = await fetch(`${API_URL}/api/chat/${chatId}/messages?offset=${offset}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (offset === 0) {
            setMessages(data);
          } else {
            setMessages((prev) => [...data, ...prev]);
          }
        }
      } catch (err) {
        console.error("Fetch messages error:", err);
      } finally {
        setLoading(false);
      }
    },
    [chatId, token]
  );

  const fetchBlocked = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/users/blocked`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        setBlockedUsers(await res.json());
      }
    } catch (e) {}
  };

  const fetchContacts = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/user/contacts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSavedContacts(await res.json());
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchMessages();
    fetchBlocked();
    fetchContacts();
  }, [fetchMessages]);

  // Socket events
  useEffect(() => {
    if (!token || !chatId) return;
    const socket = getSocket(token);
    if (!socket) return;

    socket.emit("join_chat", chatId);

    socket.on("receive_message", (msg) => {
      if (msg.chatId !== chatId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        if (msg.tempId) {
          const idx = prev.findIndex((m) => m.tempId === msg.tempId);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = { ...msg, isPending: false };
            return updated;
          }
        }
        return [...prev, { ...msg, isPending: false }];
      });
    });

    socket.on("message_delivered", ({ messageId }) => {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, isDelivered: true, isPending: false } : m)));
    });

    socket.on("message_read", ({ messageId }) => {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, isRead: true, isDelivered: true, isPending: false } : m)));
    });

    socket.on("message_edited", ({ messageId, content }) => {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, content } : m)));
    });

    socket.on("message_deleted", ({ messageId }) => {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, isDeleted: true, content: "This message was deleted" } : m)));
    });

    socket.on("message_reacted", ({ messageId, reaction }) => {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reaction } : m)));
    });

    socket.on("typing", ({ chatId: cId, userId: uid }) => {
      if (cId === chatId && uid !== user?.id) setTypingUsers((prev) => ({ ...prev, [uid]: true }));
    });
    socket.on("stop_typing", ({ userId: uid }) => {
      setTypingUsers((prev) => ({ ...prev, [uid]: false }));
    });

    return () => {
      socket.off("receive_message");
      socket.off("message_delivered");
      socket.off("message_read");
      socket.off("message_edited");
      socket.off("message_deleted");
      socket.off("message_reacted");
      socket.off("typing");
      socket.off("stop_typing");
    };
  }, [token, chatId, user?.id]);

  const sendMessage = () => {
    const content = newMessage.trim();
    if (!content || !chatId || !token) return;
    const socket = getSocket(token);
    if (!socket) return;

    if (editingId) {
      socket.emit("edit_message", { messageId: editingId, chatId, content });
      setEditingId(null);
    } else {
      const tempId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setMessages((prev) => [
        ...prev,
        {
          id: tempId,
          tempId,
          chatId,
          senderId: user?.id,
          content,
          type: "text",
          replyToId: replyingTo?.id || null,
          createdAt: new Date().toISOString(),
          isPending: true,
          isDelivered: false,
          isRead: false,
          isFailed: false,
          sender: { name: user?.displayName || "You" },
        },
      ]);
      socket.emit("send_message", { chatId, content, type: "text", replyToId: replyingTo?.id || null, tempId });
    }

    setNewMessage("");
    setReplyingTo(null);
    if (typingRef.current) clearTimeout(typingRef.current);
    socket.emit("stop_typing", { chatId });
  };

  const handleTyping = (text: string) => {
    setNewMessage(text);
    const socket = getSocket(token!);
    if (!socket || !chatId) return;
    socket.emit("typing", { chatId });
    if (typingRef.current) clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => {
      socket.emit("stop_typing", { chatId });
    }, 1500);
  };

  const handleReact = (messageId: string, reaction: string) => {
    const socket = getSocket(token!);
    if (!socket || !chatId) return;
    socket.emit("react_message", { messageId, reaction, chatId });
  };

  const handleDelete = (msg: any) => {
    const socket = getSocket(token!);
    if (!socket || !chatId || msg.senderId !== user?.id) return;
    socket.emit("delete_message", { messageId: msg.id, chatId });
    Toast.show({ type: "success", text1: "Message deleted" });
  };

  const toggleSelect = (id: string) => {
    setSelectedMessages((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const deleteSelected = () => {
    const socket = getSocket(token!);
    if (!socket || !chatId) return;
    selectedMessages.forEach((id) => {
      const msg = messages.find((m) => m.id === id);
      if (msg?.senderId === user?.id) socket.emit("delete_message", { messageId: id, chatId });
    });
    setSelectedMessages([]);
    setSelectMode(false);
    Toast.show({ type: "success", text1: "Messages deleted" });
  };

  const isBlocked = activeChat && !activeChat?.isGroup && activeChat?.otherUser && blockedUsers.some((u) => u.id === activeChat.otherUser.id);

  const renderMessage = ({ item: msg }: { item: any }) => {
    const isMe = msg.senderId === user?.id;
    const repliedMsg = msg.replyToId ? messages.find((m) => m.id === msg.replyToId) : null;

    return (
      <Pressable
        onLongPress={() => {
          if (selectMode) toggleSelect(msg.id);
          else setContextMenu(msg);
        }}
        onPress={() => {
          if (selectMode) toggleSelect(msg.id);
        }}
        style={[styles.msgRow, { justifyContent: isMe ? "flex-end" : "flex-start" }]}
      >
        {selectMode && (
          <TouchableOpacity onPress={() => toggleSelect(msg.id)} style={{ marginRight: 8 }}>
            <MaterialCommunityIcons
              name={selectedMessages.includes(msg.id) ? "checkbox-marked" : "checkbox-blank-outline"}
              size={20}
              color={selectedMessages.includes(msg.id) ? Colors.primary : Colors.textSecondary}
            />
          </TouchableOpacity>
        )}
        <View
          style={[
            styles.msgBubble,
            {
              backgroundColor: isMe ? Colors.bgBubbleOut : Colors.bgBubbleIn,
              borderBottomRightRadius: isMe ? 4 : 16,
              borderBottomLeftRadius: isMe ? 16 : 4,
            },
          ]}
        >
          {msg.isStarred && (
            <MaterialCommunityIcons
              name="star"
              size={14}
              color={Colors.star}
              style={{ position: "absolute", top: 6, right: 6 }}
            />
          )}
          {msg.isDeleted ? (
            <Text style={[styles.msgDeleted, { color: isMe ? "#fff" : Colors.textSecondary }]}>
              This message was deleted
            </Text>
          ) : (
            <>
              {!isMe && activeChat?.isGroup && (
                <Text style={styles.msgSender}>{msg.sender?.name || msg.senderName || "User"}</Text>
              )}
              {repliedMsg && (
                <View style={[styles.replyBlock, { borderLeftColor: isMe ? "#fff" : Colors.primary }]}>
                  <Text style={[styles.replyName, { color: isMe ? "#fff" : Colors.primary }]}>
                    {repliedMsg.senderId === user?.id ? "You" : repliedMsg.sender?.name || "User"}
                  </Text>
                  <Text style={styles.replyContent} numberOfLines={2}>
                    {repliedMsg.isDeleted
                      ? "Deleted"
                      : repliedMsg.type === "image"
                      ? "📷 Photo"
                      : repliedMsg.type === "audio"
                      ? "🎤 Audio"
                      : repliedMsg.content}
                  </Text>
                </View>
              )}
              {msg.type === "image" ? (
                <Image source={{ uri: msg.content }} style={styles.msgImage} />
              ) : msg.type === "audio" ? (
                <View style={styles.audioBubble}>
                  <MaterialCommunityIcons name="play-circle" size={28} color={Colors.primary} />
                  <Text style={styles.audioLabel}>Voice message</Text>
                </View>
              ) : (
                <Text style={styles.msgText}>{msg.content}</Text>
              )}
              <View style={styles.msgFooter}>
                <Text style={[styles.msgTime, { color: isMe ? "rgba(255,255,255,0.7)" : Colors.textSecondary }]}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
                {isMe && (
                  <MaterialCommunityIcons
                    name={
                      msg.isPending
                        ? "clock-outline"
                        : msg.isFailed
                        ? "alert-circle"
                        : msg.isRead
                        ? "check-all"
                        : msg.isDelivered
                        ? "check-all"
                        : "check"
                    }
                    size={14}
                    color={
                      msg.isPending
                        ? Colors.textMuted
                        : msg.isFailed
                        ? Colors.danger
                        : msg.isRead
                        ? Colors.readReceipt
                        : Colors.textSecondary
                    }
                  />
                )}
              </View>
              {msg.reaction && (
                <View style={styles.reactionBadge}>
                  <Text style={{ fontSize: 14 }}>{msg.reaction}</Text>
                </View>
              )}
            </>
          )}
        </View>
      </Pressable>
    );
  };

  const filteredMessages = chatSearch.trim()
    ? messages.filter((m) => m.content?.toLowerCase().includes(chatSearch.toLowerCase()))
    : messages;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 8 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1, flexDirection: "row", alignItems: "center" }} onPress={() => setContactInfo(true)}>
          <Avatar name={name || "Chat"} photo={photo} size={40} />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.headerName}>{name || "Chat"}</Text>
            {Object.values(typingUsers).some(Boolean) ? (
              <Text style={styles.headerStatus}>typing...</Text>
            ) : (
              <Text style={styles.headerStatus}>{isGroup === "1" ? "Group" : "Online"}</Text>
            )}
          </View>
        </TouchableOpacity>
        <View style={{ flexDirection: "row", gap: 4 }}>
          <TouchableOpacity onPress={() => setIsSearchOpen(!isSearchOpen)} style={{ padding: 8 }}>
            <MaterialCommunityIcons name="magnify" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSelectMode(!selectMode)} style={{ padding: 8 }}>
            <MaterialCommunityIcons name="check-circle-outline" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar */}
      {isSearchOpen && (
        <View style={styles.searchBar}>
          <TextInput
            placeholder="Search messages..."
            placeholderTextColor={Colors.textSecondary}
            value={chatSearch}
            onChangeText={setChatSearch}
            style={styles.searchInput}
            autoFocus
          />
          <TouchableOpacity onPress={() => { setIsSearchOpen(false); setChatSearch(""); }}>
            <MaterialCommunityIcons name="close" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {loading ? (
          <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 60 }} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={filteredMessages}
            keyExtractor={(item, idx) => item.id || idx.toString()}
            renderItem={renderMessage}
            contentContainerStyle={{ padding: 12, paddingBottom: 20 }}
            ListEmptyComponent={
              <View style={styles.emptyMsg}>
                <Text style={styles.emptyMsgText}>No messages yet. Send your first message!</Text>
              </View>
            }
            onEndReached={() => {
              if (messages.length >= 50) fetchMessages(messages.length);
            }}
            onEndReachedThreshold={0.3}
            inverted={false}
          />
        )}

        {/* Typing indicator */}
        {Object.values(typingUsers).some(Boolean) && (
          <View style={styles.typingRow}>
            <Text style={styles.typingLabel}>Someone is typing...</Text>
          </View>
        )}

        {/* Selected messages bar */}
        {selectedMessages.length > 0 && (
          <View style={styles.selectionBar}>
            <Text style={styles.selectionText}>{selectedMessages.length} selected</Text>
            <TouchableOpacity onPress={deleteSelected} style={{ padding: 8 }}>
              <MaterialCommunityIcons name="delete" size={22} color={Colors.danger} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setSelectedMessages([]); setSelectMode(false); }} style={{ padding: 8 }}>
              <MaterialCommunityIcons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Reply indicator */}
        {replyingTo && (
          <View style={styles.replyBar}>
            <View style={styles.replyBarContent}>
              <Text style={styles.replyBarLabel}>
                Replying to {replyingTo.senderId === user?.id ? "yourself" : replyingTo.sender?.name || "User"}
              </Text>
              <Text style={styles.replyBarText} numberOfLines={1}>
                {lastMessagePreview(replyingTo)}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setReplyingTo(null)}>
              <MaterialCommunityIcons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity onPress={() => Alert.alert("Info", "Attachments coming soon")} style={{ padding: 8 }}>
            <MaterialCommunityIcons name="plus" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          {newMessage.trim() ? (
            <TouchableOpacity onPress={() => Alert.alert("Info", "Emoji picker coming soon")} style={{ padding: 8 }}>
              <MaterialCommunityIcons name="emoticon-outline" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
          <View style={styles.inputWrap}>
            <TextInput
              value={newMessage}
              onChangeText={handleTyping}
              placeholder="Type a message"
              placeholderTextColor={Colors.textSecondary}
              style={styles.input}
              multiline
            />
          </View>
          {newMessage.trim() ? (
            <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
              <MaterialCommunityIcons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => {
                Alert.alert("Recording", "Voice recording coming soon");
              }}
              style={styles.sendBtn}
            >
              <MaterialCommunityIcons name="microphone" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Context menu modal */}
      <Modal visible={!!contextMenu} transparent animationType="fade">
        <Pressable style={styles.contextOverlay} onPress={() => setContextMenu(null)}>
          <View style={styles.contextMenu}>
            <View style={styles.reactionRow}>
              {["👍", "❤️", "😂", "😮", "😢"].map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => { handleReact(contextMenu?.id, emoji); setContextMenu(null); }}
                  style={{ padding: 8 }}
                >
                  <Text style={{ fontSize: 24 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.contextItem}
              onPress={() => { setReplyingTo(contextMenu); setContextMenu(null); }}
            >
              <MaterialCommunityIcons name="reply" size={20} color={Colors.text} />
              <Text style={styles.contextItemText}>Reply</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contextItem}
              onPress={() => {
                if (contextMenu?.content) {
                  // Clipboard not available in all environments, just show toast
                  Toast.show({ type: "success", text1: "Copied" });
                }
                setContextMenu(null);
              }}
            >
              <MaterialCommunityIcons name="content-copy" size={20} color={Colors.text} />
              <Text style={styles.contextItemText}>Copy</Text>
            </TouchableOpacity>
            {contextMenu?.senderId === user?.id && (
              <TouchableOpacity
                style={styles.contextItem}
                onPress={() => {
                  setEditingId(contextMenu.id);
                  setNewMessage(contextMenu.content);
                  setContextMenu(null);
                }}
              >
                <MaterialCommunityIcons name="pencil" size={20} color={Colors.text} />
                <Text style={styles.contextItemText}>Edit</Text>
              </TouchableOpacity>
            )}
            {contextMenu?.senderId === user?.id && (
              <TouchableOpacity
                style={styles.contextItem}
                onPress={() => { handleDelete(contextMenu); setContextMenu(null); }}
              >
                <MaterialCommunityIcons name="delete" size={20} color={Colors.danger} />
                <Text style={[styles.contextItemText, { color: Colors.danger }]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Modal>

      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgPanel,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  headerName: { fontSize: 17, fontWeight: "700", color: Colors.text },
  headerStatus: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgPanel,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    height: 36,
    backgroundColor: Colors.bgInput,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  msgRow: {
    flexDirection: "row",
    marginBottom: 8,
    maxWidth: "80%",
  },
  msgBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 80,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  msgSender: { fontSize: 12, fontWeight: "700", color: Colors.primary, marginBottom: 2 },
  msgText: { fontSize: 15, color: Colors.text, lineHeight: 20 },
  msgDeleted: { fontSize: 14, fontStyle: "italic", opacity: 0.7 },
  msgImage: { width: 200, height: 200, borderRadius: 8, marginVertical: 4 },
  msgFooter: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: 4, gap: 4 },
  msgTime: { fontSize: 10 },
  replyBlock: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    marginBottom: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 4,
    padding: 6,
  },
  replyName: { fontSize: 12, fontWeight: "600" },
  replyContent: { fontSize: 12, opacity: 0.8, marginTop: 2 },
  reactionBadge: {
    position: "absolute",
    bottom: -10,
    right: 8,
    backgroundColor: Colors.bgModal,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  audioBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  audioLabel: { color: Colors.text, fontSize: 14 },
  emptyMsg: { alignItems: "center", marginTop: 60, paddingHorizontal: 40 },
  emptyMsgText: { color: Colors.textSecondary, fontSize: 14, textAlign: "center" },
  typingRow: { paddingHorizontal: 16, paddingVertical: 4 },
  typingLabel: { fontSize: 12, color: Colors.primary, fontStyle: "italic" },
  selectionBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgPanel,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  selectionText: { flex: 1, fontSize: 14, color: Colors.text, fontWeight: "500" },
  replyBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgPanel,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  replyBarContent: { flex: 1, marginRight: 8 },
  replyBarLabel: { fontSize: 12, fontWeight: "600", color: Colors.primary },
  replyBarText: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgPanel,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: Colors.bgInput,
    borderRadius: 20,
    paddingHorizontal: 14,
    maxHeight: 100,
  },
  input: {
    color: Colors.text,
    fontSize: 15,
    paddingVertical: 8,
    minHeight: 36,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  contextOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  contextMenu: {
    backgroundColor: Colors.bgModal,
    borderRadius: 16,
    padding: 8,
    minWidth: 220,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  reactionRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    marginBottom: 4,
  },
  contextItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  contextItemText: { fontSize: 15, color: Colors.text },
});
