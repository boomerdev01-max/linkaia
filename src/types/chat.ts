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
  // Champs pour l'optimistic UI
  sendStatus?: "sending" | "sent" | "error";
  tempId?: string;
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

// ─── CALL TYPES ──────────────────────────────────────────────────────────────

/** Types d'appels supportés */
export type CallType = "audio" | "video";

/** États du cycle de vie d'un appel */
export type CallStatus =
  | "idle" // Aucun appel en cours
  | "calling" // Appelant : sonnerie envoyée, attente réponse
  | "ringing" // Appelé : popup "appel entrant" affichée
  | "connected" // Appel en cours (les deux participants sont dans la room)
  | "ended"; // Appel terminé (raccroché, refusé, timeout)

/** Raisons de fin d'appel */
export type CallEndReason =
  | "hangup" // Raccroché manuellement
  | "rejected" // Refusé par l'appelé
  | "timeout" // Pas de réponse après 30s
  | "error"; // Erreur technique

/** Session d'appel active */
export interface CallSession {
  /** ID unique de la session (= roomName LiveKit) */
  sessionId: string;
  /** ID de la conversation associée */
  conversationId: string;
  /** Type d'appel */
  type: CallType;
  /** Statut courant */
  status: CallStatus;
  /** Initiateur de l'appel */
  caller: ChatUser;
  /** Participants invités (hors appelant) */
  participants: ChatUser[];
  /** Token LiveKit pour rejoindre la room (disponible après acceptation) */
  livekitToken?: string;
  /** URL LiveKit publique */
  livekitUrl?: string;
  /** Timestamp de début de sonnerie (pour timeout) */
  startedAt: number;
  /** Timestamp de connexion effective */
  connectedAt?: number;
}

// ─── REALTIME CALL EVENTS ────────────────────────────────────────────────────

/**
 * Événements échangés via Supabase Realtime channel `call:{conversationId}`
 * Tous les events incluent l'ID de session pour filtrer les messages parasites.
 */

export interface CallEventBase {
  sessionId: string;
  conversationId: string;
  senderId: string;
}

/** Appelant → Tous : initiation d'un appel */
export interface CallInitiatedEvent extends CallEventBase {
  type: "call.initiated";
  callType: CallType;
  caller: ChatUser;
  /** Participants ciblés (pour les groupes) */
  targetUserIds: string[];
}

/** Appelé → Appelant : acceptation */
export interface CallAnsweredEvent extends CallEventBase {
  type: "call.answered";
  /** Token LiveKit généré pour cet utilisateur */
  livekitToken: string;
  livekitUrl: string;
}

/** Appelé → Appelant : refus */
export interface CallRejectedEvent extends CallEventBase {
  type: "call.rejected";
}

/** N'importe qui → Tous : fin d'appel */
export interface CallEndedEvent extends CallEventBase {
  type: "call.ended";
  reason: CallEndReason;
}

export type CallEvent =
  | CallInitiatedEvent
  | CallAnsweredEvent
  | CallRejectedEvent
  | CallEndedEvent;

// ─── REALTIME PAYLOAD TYPES (existants) ──────────────────────────────────────

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
