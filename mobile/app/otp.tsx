import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { BlurView } from "expo-blur";
import { router, useLocalSearchParams } from "expo-router";
import { useDispatch } from "react-redux";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import { loginSuccess } from "@/redux/authSlice";
import { API_URL } from "@/utils/api";
import { Colors } from "@/constants/theme";

export default function OTPScreen() {
  const { phoneNumber, email } = useLocalSearchParams<{
    phoneNumber: string;
    email: string;
  }>();

  const dispatch = useDispatch();

  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!phoneNumber || !email) {
      router.replace("/login");
    }
  }, [phoneNumber, email]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerify = async () => {
    if (!code) {
      Toast.show({ type: "error", text1: "Please enter the OTP" });
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, email, code, displayName }),
      });

      if (!res.ok) {
        let message = "Failed to verify OTP";
        try {
          const error = await res.json();
          message = error.error || message;
        } catch {}
        throw new Error(message);
      }

      const data = await res.json();

      dispatch(loginSuccess({ user: data.user, token: data.token }));

      Toast.show({ type: "success", text1: "Logged in successfully" });
      router.replace("/(tabs)");
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.message || "Invalid OTP" });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !phoneNumber || !email) return;

    setIsSending(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, email }),
      });

      if (!res.ok) {
        throw new Error("Unable to resend OTP");
      }

      Toast.show({ type: "success", text1: "OTP resent to your email" });
      setResendCooldown(30);
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.message });
    } finally {
      setIsSending(false);
    }
  };

  const handleChangeAccount = () => {
    router.replace("/login");
  };

  if (!phoneNumber || !email) return null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View pointerEvents="none" style={styles.backdropGlowA} />
        <View pointerEvents="none" style={styles.backdropGlowB} />
        <View style={styles.header}>
          <View style={styles.icon}>
            <MaterialCommunityIcons name="shield-check" size={40} color="#fff" />
          </View>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            A one-time code was sent to{" "}
            <Text style={{ fontWeight: "700", color: Colors.primary }}>{email}</Text>
          </Text>
        </View>

        <BlurView intensity={28} tint="dark" style={styles.glowCard}>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <MaterialCommunityIcons
                name="account-outline"
                size={20}
                color={Colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                placeholder="Your name (optional)"
                placeholderTextColor={Colors.textSecondary}
                value={displayName}
                onChangeText={setDisplayName}
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={20}
                color={Colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                placeholder="Enter OTP"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="number-pad"
                value={code}
                onChangeText={setCode}
                maxLength={6}
                style={[styles.input, { textAlign: "center", fontSize: 22, letterSpacing: 8 }]}
              />
            </View>

            <Pressable
              style={[styles.verifyButton, isVerifying && { opacity: 0.7 }]}
              onPress={handleVerify}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.verifyText}>Verify & Login</Text>
              )}
            </Pressable>

            <Pressable
              style={[styles.secondaryButton, (resendCooldown > 0 || isSending) && { opacity: 0.5 }]}
              onPress={handleResend}
              disabled={resendCooldown > 0 || isSending}
            >
              {isSending ? (
                <ActivityIndicator color={Colors.primary} size="small" />
              ) : (
                <Text style={styles.secondaryText}>
                  {resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : "Resend OTP"}
                </Text>
              )}
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={handleChangeAccount}>
              <Text style={styles.secondaryText}>Change email or phone</Text>
            </Pressable>

            <Text style={styles.note}>
              Enter the code from your email to complete login.
            </Text>
          </View>
        </BlurView>
      </ScrollView>
      <Toast />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    backgroundColor: Colors.bg,
    padding: 20,
    position: "relative",
  },
  backdropGlowA: {
    position: "absolute",
    top: 100,
    left: 20,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(124, 77, 255, 0.16)",
  },
  backdropGlowB: {
    position: "absolute",
    bottom: 120,
    right: 30,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(37, 211, 102, 0.12)",
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  icon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 8,
    textAlign: "center",
    color: Colors.textSecondary,
    fontSize: 14,
    maxWidth: 300,
    lineHeight: 20,
  },
  glowCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    backgroundColor: "rgba(14, 19, 35, 0.76)",
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgInput,
    borderRadius: 14,
    marginBottom: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    height: 52,
    color: Colors.text,
    fontSize: 16,
  },
  verifyButton: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  verifyText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 17,
  },
  secondaryButton: {
    marginTop: 12,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryText: {
    color: Colors.text,
    fontWeight: "600",
    fontSize: 15,
  },
  note: {
    marginTop: 20,
    textAlign: "center",
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});