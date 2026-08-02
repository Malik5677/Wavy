import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "@/constants/theme";

export default function ProfileShareScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile Share</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, justifyContent: "center", alignItems: "center" },
  text: { color: Colors.text, fontSize: 18 },
});