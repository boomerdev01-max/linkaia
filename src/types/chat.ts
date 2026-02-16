// types/chat.ts
// Shared types for the chat system

export interface ChatUser {
  id: string;
  nom: string;
  prenom: string;
  pseudo?: string | null;
  profilePhotoUrl?: string | null;
}

export interface MessageMedia {
  id: string;
  type: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT" | "VOICE";
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  thumbnailUrl?: string | null;
}

export interface MessageReaction {
  id: string;
  emoji: string;
  userId: string;
  user: ChatUser;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  content: string | null;
  type: "TEXT" | "MEDIA" | "VOICE" | "MIXED";
  isEdited: boolean;
  isDeleted: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  sender: ChatUser;
  media: MessageMedia[];
  reactions: MessageReaction[];
  replyTo?: Message | null;
  readBy?: { id: string; readAt: string }[];
  // ✅ Champs pour l'optimistic UI
  sendStatus?: "sending" | "sent" | "error"; // undefined = message reçu
  tempId?: string; // ID temporaire côté client avant confirmation serveur
}

export interface ConversationParticipant {
  id: string;
  userId: string;
  user: ChatUser;
  role: "admin" | "member";
  joinedAt: string;
  lastReadAt: string | null;
  isMuted: boolean;
  isArchived: boolean;
}

export interface Conversation {
  id: string;
  name: string | null;
  type: "direct" | "group";
  avatarUrl: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  participants: ConversationParticipant[];
  lastMessage?: Message | null;
  unreadCount?: number;
}

export interface ConversationListItem {
  id: string;
  name: string;
  avatarUrl: string | null;
  type: "direct" | "group";
  lastMessage: string | null;
  lastMessageTime: string | null;
  lastMessageSenderId: string | null;
  unreadCount: number;
  isOnline?: boolean;
  participants: {
    id: string;
    userId: string;
    user: ChatUser;
  }[];
}

// Realtime payload types
export interface RealtimeMessagePayload {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new?: Message;
  old?: { id: string };
}

export interface RealtimeReactionPayload {
  eventType: "INSERT" | "DELETE";
  new?: MessageReaction & { messageId: string };
  old?: { id: string; messageId: string };
}

// Message reactions emojis
export const MESSAGE_REACTIONS = [
  { emoji: "👍", label: "Pouce" },
  { emoji: "❤️", label: "Coeur" },
  { emoji: "😂", label: "Rire" },
  { emoji: "😮", label: "Surpris" },
  { emoji: "😢", label: "Triste" },
  { emoji: "🙏", label: "Merci" },
] as const;

export type MessageReactionEmoji = (typeof MESSAGE_REACTIONS)[number]["emoji"];
