import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Image,
  Alert,
  Platform,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import * as FileSystem from "expo-file-system";

import { RootState } from "@/redux/store";
import { logout } from "@/redux/authSlice";
import { API_URL } from "@/utils/api";
import { disconnectSocket } from "@/utils/socket";
import { Colors } from "@/constants/theme";
import Avatar from "@/components/Avatar";

export default function SettingsScreen() {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const [showProfile, setShowProfile] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [backupFileName, setBackupFileName] = useState("");

  const handleSaveProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/api/user/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ displayName, bio }),
      });
      if (res.ok) {
        Toast.show({ type: "success", text1: "Profile updated" });
        setShowProfile(false);
      }
    } catch (e) {
      Toast.show({ type: "error", text1: "Failed to update" });
    }
  };

  const handleExportData = async () => {
    if (!token) return;
    try {
      const fileUri = `${FileSystem.Paths.document.uri}wavy-export-${user?.id}.json`;
      const dest = new FileSystem.File(fileUri);
      await FileSystem.File.downloadFileAsync(
        `${API_URL}/api/user/export?download=true`,
        dest,
        { headers: { Authorization: `Bearer ${token}` }, idempotent: true }
      );
      Toast.show({ type: "success", text1: "Data exported" });
    } catch (e) {
      Toast.show({ type: "error", text1: "Export failed" });
    }
  };

  const handleCreateBackup = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/user/backup`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBackupFileName(data.fileName);
        Toast.show({ type: "success", text1: "Backup created" });
      }
    } catch (e) {
      Toast.show({ type: "error", text1: "Backup failed" });
    }
  };

  const handleDownloadBackup = async () => {
    if (!backupFileName || !token) return;
    try {
      const fileUri = `${FileSystem.Paths.document.uri}${backupFileName}`;
      const dest = new FileSystem.File(fileUri);
      await FileSystem.File.downloadFileAsync(
        `${API_URL}/api/user/backup/${backupFileName}`,
        dest,
        { headers: { Authorization: `Bearer ${token}` }, idempotent: true }
      );
      Toast.show({ type: "success", text1: "Backup downloaded" });
    } catch (e) {
      Toast.show({ type: "error", text1: "Download failed" });
    }
  };

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: () => {
          disconnectSocket();
          dispatch(logout());
          router.replace("/login");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Profile Section */}
        <TouchableOpacity style={styles.profileCard} onPress={() => setShowProfile(true)}>
          <Avatar
            name={user?.displayName || user?.username || "U"}
            photo={user?.profilePhoto}
            size={72}
            online={false}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.displayName || user?.username || "Set Name"}</Text>
            <Text style={styles.profileBio}>{user?.bio || "Available"}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* Settings Options */}
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.section}>
          <SettingRow icon="account-outline" label="Account" />
          <SettingRow icon="lock-outline" label="Privacy" />
          <SettingRow icon="message-outline" label="Chats" />
          <SettingRow icon="bell-outline" label="Notifications" />
          <SettingRow icon="shield-outline" label="Blocked Contacts" />
          <SettingRow icon="help-circle-outline" label="Help" />
        </View>

        {/* Data Section */}
        <Text style={styles.sectionTitle}>Data & Backup</Text>
        <View style={styles.section}>
          <TouchableOpacity style={styles.dataRow} onPress={handleExportData}>
            <MaterialCommunityIcons name="file-export-outline" size={22} color={Colors.text} />
            <Text style={styles.dataLabel}>Export My Data</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dataRow} onPress={handleCreateBackup}>
            <MaterialCommunityIcons name="backup-restore" size={22} color={Colors.text} />
            <Text style={styles.dataLabel}>Create Backup</Text>
          </TouchableOpacity>
          {backupFileName ? (
            <TouchableOpacity style={styles.dataRow} onPress={handleDownloadBackup}>
              <MaterialCommunityIcons name="download" size={22} color={Colors.primary} />
              <Text style={[styles.dataLabel, { color: Colors.primary }]}>Download Backup</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={22} color={Colors.danger} />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showProfile} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowProfile(false)}>
                <MaterialCommunityIcons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.avatarSection}>
              <Avatar
                name={user?.displayName || user?.username || "U"}
                photo={user?.profilePhoto}
                size={88}
                online={false}
              />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={Colors.textSecondary}
              value={displayName}
              onChangeText={setDisplayName}
            />
            <TextInput
              style={[styles.input, { minHeight: 80 }]}
              placeholder="About"
              placeholderTextColor={Colors.textSecondary}
              value={bio}
              onChangeText={setBio}
              multiline
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Toast />
    </SafeAreaView>
  );
}

function SettingRow({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.settingRow}>
      <MaterialCommunityIcons name={icon as any} size={22} color={Colors.text} />
      <Text style={styles.settingLabel}>{label}</Text>
    </View>
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
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgPanel,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  profileInfo: { flex: 1, marginLeft: 14 },
  profileName: { fontSize: 18, fontWeight: "700", color: Colors.text },
  profileBio: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  section: {
    backgroundColor: Colors.bgPanel,
    borderRadius: 16,
    marginBottom: 24,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  settingLabel: { fontSize: 15, color: Colors.text, marginLeft: 14 },
  dataRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  dataLabel: { fontSize: 15, color: Colors.text, marginLeft: 14 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  logoutText: { fontSize: 16, color: Colors.danger, fontWeight: "600" },
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
    marginBottom: 20,
  },
  modalTitle: { fontSize: 19, fontWeight: "700", color: Colors.text },
  avatarSection: { alignItems: "center", marginBottom: 20 },
  input: {
    backgroundColor: Colors.bgInput,
    borderRadius: 12,
    padding: 14,
    color: Colors.text,
    fontSize: 15,
    marginBottom: 12,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});