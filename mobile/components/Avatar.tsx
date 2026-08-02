import React from "react";
import { View, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";

interface AvatarProps {
  name: string;
  photo?: string | null;
  size?: number;
  online?: boolean;
  group?: boolean;
}

export default function Avatar({ name, photo, size = 56, online = false, group = false }: AvatarProps) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const bgColor = group ? Colors.primary : Colors.bgPanel;

  return (
    <View style={{ position: "relative", width: size, height: size }}>
      {photo ? (
        <Image
          source={{ uri: photo }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: Colors.bgPanel,
          }}
        />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bgColor,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialCommunityIcons
            name={group ? "account-group" : "account"}
            size={size * 0.45}
            color={group ? "#fff" : Colors.textSecondary}
          />
        </View>
      )}
      {online && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: size * 0.22,
            height: size * 0.22,
            borderRadius: (size * 0.22) / 2,
            backgroundColor: Colors.online,
            borderWidth: 2,
            borderColor: Colors.bg,
          }}
        />
      )}
    </View>
  );
}