export function chatListTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[date.getDay()];
  } else {
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }
}

export function lastMessagePreview(msg: any): string {
  if (!msg) return "Started a chat";
  if (msg.isDeleted) return "This message was deleted";
  if (msg.type === "image") return "📷 Photo";
  if (msg.type === "audio") return "🎤 Voice message";
  if (msg.type === "video") return "🎬 Video";
  if (msg.type === "file") {
    try {
      const parsed = JSON.parse(msg.content);
      return `📎 ${parsed.name || "File"}`;
    } catch {
      return "📎 File";
    }
  }
  return msg.content || "Started a chat";
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
