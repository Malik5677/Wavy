import React, { useState } from "react";
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
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useDispatch } from "react-redux";
import Toast from "react-native-toast-message";

import { setOtpCredentials } from "@/redux/authSlice";
import { API_URL } from "@/utils/api";
import { Colors } from "@/constants/theme";

const normalizePhoneNumber = (input: string) => {
  const digits = input.replace(/[^0-9]/g, "");
  if (digits.length === 10) return digits;
  if (digits.length > 10) return digits.slice(-10);
  return digits;
};

const isValidPhoneNumber = (phone: string) => {
  const digits = normalizePhoneNumber(phone);
  return /^[6789][0-9]{9}$/.test(digits);
};

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleLogin = async () => {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    if (!normalizedPhone) {
      Toast.show({ type: "error", text1: "Please enter your phone number" });
      return;
    }

    if (!isValidPhoneNumber(normalizedPhone)) {
      Toast.show({
        type: "error",
        text1: "Invalid phone number",
        text2: "Must be 10 digits starting with 6, 7, 8, or 9",
      });
      return;
    }

    if (!email || !isValidEmail(email)) {
      Toast.show({ type: "error", text1: "Please enter a valid email" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ phoneNumber: normalizedPhone, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      dispatch(setOtpCredentials({ phoneNumber: normalizedPhone, email }));

      Toast.show({ type: "success", text1: "OTP sent to your email" });
      if (data.mockCode) {
        Toast.show({ type: "info", text1: `Mock Code: ${data.mockCode}`, visibilityTime: 8000 });
      }

      router.push({
        pathname: "/otp",
        params: { phoneNumber: normalizedPhone, email },
      });
    } catch (error: any) {
      Toast.show({ type: "error", text1: error?.message || "Network request failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="whatsapp" size={42} color="#fff" />
          </View>

          <Text style={styles.title}>WaveChat</Text>
          <Text style={styles.subtitle}>
            Login with your phone number and email. An OTP will be sent to your inbox.
          </Text>

          <View style={styles.inputGroup}>
            <MaterialCommunityIcons
              name="phone-outline"
              size={20}
              color={Colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              placeholder="Phone number"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              style={styles.input}
              maxLength={10}
            />
          </View>

          <View style={styles.inputGroup}>
            <MaterialCommunityIcons
              name="email-outline"
              size={20}
              color={Colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              placeholder="Email address"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />
          </View>

          <Pressable
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Send OTP</Text>
            )}
          </Pressable>

          <Text style={styles.footer}>OTP is delivered by email only.</Text>
        </View>
      </ScrollView>
      <Toast />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.bg,
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: Colors.bgPanel,
    borderRadius: 20,
    padding: 32,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    textAlign: "center",
    fontSize: 28,
    fontWeight: "800",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    textAlign: "center",
    color: Colors.textSecondary,
    marginTop: 8,
    marginBottom: 28,
    fontSize: 14,
    lineHeight: 20,
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
  button: {
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 17,
  },
  footer: {
    marginTop: 20,
    textAlign: "center",
    color: Colors.textSecondary,
    fontSize: 13,
  },
});