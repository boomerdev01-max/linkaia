// hooks/use-call.ts
// Gestion complète du cycle de vie d'un appel audio/vidéo.
//
// Signalisation : Supabase Realtime channel `call:{conversationId}`
// Média         : LiveKit (token généré via /api/calls/token)
//
// Cycle de vie :
//   [Appelant]  initiateCall()  → status: "calling"  → envoie call.initiated
//   [Appelé]    reçoit call.initiated → status: "ringing" → popup
//   [Appelé]    answerCall()    → génère token → envoie call.answered → status: "connected"
//   [Appelé]    rejectCall()    → envoie call.rejected → status: "ended"
//   [N'importe] hangUp()        → envoie call.ended → status: "ended" → deleteRoom

"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type {
  CallSession,
  CallType,
  CallEndReason,
  CallEvent,
  CallInitiatedEvent,
  ChatUser,
} from "@/types/chat";

const CALL_TIMEOUT_MS = 30_000; // 30 secondes sans réponse

interface UseCallOptions {
  conversationId: string;
  currentUser: ChatUser;
  /** Participants de la conversation (pour trouver les cibles) */
  participants: { userId: string; user: ChatUser }[];
}

interface UseCallReturn {
  /** Session d'appel courante (null si idle) */
  callSession: CallSession | null;
  /** Initier un appel */
  initiateCall: (type: CallType) => Promise<void>;
  /** Accepter un appel entrant */
  answerCall: () => Promise<void>;
  /** Refuser un appel entrant */
  rejectCall: () => void;
  /** Raccrocher (fonctionne en état calling, ringing ou connected) */
  hangUp: (reason?: CallEndReason) => void;
  /** true si une popup "appel entrant" doit être affichée */
  isIncomingCall: boolean;
}

export function useCall({
  conversationId,
  currentUser,
  participants,
}: UseCallOptions): UseCallReturn {
  const supabase = getSupabaseBrowserClient();

  const [callSession, setCallSession] = useState<CallSession | null>(null);

  // Refs pour accéder aux valeurs courantes dans les callbacks sans re-subscribe
  const callSessionRef = useRef<CallSession | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronise la ref avec l'état
  useEffect(() => {
    callSessionRef.current = callSession;
  }, [callSession]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Construit le nom de la room LiveKit à partir du sessionId */
  const buildSessionId = (convId: string): string =>
    `call_${convId}_${Date.now()}`;

  /** Annule le timer de timeout en cours */
  const clearCallTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  /** Envoie un événement de signalisation sur le channel Realtime */
  const broadcast = useCallback((event: CallEvent) => {
    const channel = channelRef.current;
    if (!channel) return;
    channel.send({
      type: "broadcast",
      event: event.type,
      payload: event,
    });
  }, []);

  /**
   * Demande un token LiveKit à l'API pour la session en cours.
   * Retourne { token, livekitUrl } ou lève une erreur.
   */
  const fetchCallToken = useCallback(
    async (
      sessionId: string,
    ): Promise<{ token: string; livekitUrl: string }> => {
      const response = await fetch("/api/calls/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, conversationId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Impossible de générer le token d'appel");
      }

      return response.json();
    },
    [conversationId],
  );

  /**
   * Supprime la room LiveKit côté serveur.
   * Appelé par celui qui raccroche en dernier (hangUp).
   */
  const deleteCallRoom = useCallback(
    async (sessionId: string) => {
      try {
        await fetch("/api/calls/end", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, conversationId }),
        });
      } catch (err) {
        console.warn("[useCall] Impossible de supprimer la room:", err);
      }
    },
    [conversationId],
  );

  /** Réinitialise proprement l'état d'appel */
  const resetCall = useCallback(() => {
    clearCallTimeout();
    setCallSession(null);
  }, [clearCallTimeout]);

  // ── Handlers d'événements entrants ────────────────────────────────────────

  const handleCallInitiated = useCallback(
    (payload: CallInitiatedEvent) => {
      const session = callSessionRef.current;

      // Ignorer si c'est nous qui avons initié, ou si un appel est déjà en cours
      if (
        payload.senderId === currentUser.id ||
        (session && session.status !== "idle" && session.status !== "ended")
      ) {
        return;
      }

      // Vérifier qu'on est bien ciblé
      if (!payload.targetUserIds.includes(currentUser.id)) return;

      setCallSession({
        sessionId: payload.sessionId,
        conversationId: payload.conversationId,
        type: payload.callType,
        status: "ringing",
        caller: payload.caller,
        participants: [payload.caller],
        startedAt: Date.now(),
      });

      // Auto-rejet après 30s si on ne décroche pas
      timeoutRef.current = setTimeout(() => {
        const current = callSessionRef.current;
        if (current?.status === "ringing") {
          broadcast({
            type: "call.ended",
            sessionId: current.sessionId,
            conversationId,
            senderId: currentUser.id,
            reason: "timeout",
          });
          resetCall();
        }
      }, CALL_TIMEOUT_MS);
    },
    [currentUser.id, conversationId, broadcast, resetCall],
  );

  const handleCallAnswered = useCallback(
    async (payload: {
      sessionId: string;
      livekitToken: string;
      livekitUrl: string;
      senderId: string;
    }) => {
      const session = callSessionRef.current;

      // Seul l'appelant traite cet événement
      if (!session || session.status !== "calling") return;
      if (payload.sessionId !== session.sessionId) return;

      clearCallTimeout();

      // L'appelant récupère son propre token
      try {
        const { token, livekitUrl } = await fetchCallToken(session.sessionId);
        setCallSession((prev) =>
          prev
            ? {
                ...prev,
                status: "connected",
                livekitToken: token,
                livekitUrl,
                connectedAt: Date.now(),
              }
            : prev,
        );
      } catch (err) {
        console.error("[useCall] Erreur token appelant:", err);
        hangUp("error");
      }
    },
    [clearCallTimeout, fetchCallToken],
  );

  const handleCallRejected = useCallback(
    (payload: { sessionId: string }) => {
      const session = callSessionRef.current;
      if (!session || session.status !== "calling") return;
      if (payload.sessionId !== session.sessionId) return;

      clearCallTimeout();
      resetCall();
    },
    [clearCallTimeout, resetCall],
  );

  const handleCallEnded = useCallback(
    (payload: { sessionId: string; senderId: string }) => {
      const session = callSessionRef.current;
      if (!session) return;
      if (payload.sessionId !== session.sessionId) return;

      // Si c'est nous qui avons envoyé l'événement, on ignore (déjà géré dans hangUp)
      if (payload.senderId === currentUser.id) return;

      clearCallTimeout();
      resetCall();
    },
    [currentUser.id, clearCallTimeout, resetCall],
  );

  // ── Abonnement Supabase Realtime ───────────────────────────────────────────

  useEffect(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`call:${conversationId}`)
      .on("broadcast", { event: "call.initiated" }, ({ payload }) =>
        handleCallInitiated(payload as CallInitiatedEvent),
      )
      .on("broadcast", { event: "call.answered" }, ({ payload }) =>
        handleCallAnswered(payload),
      )
      .on("broadcast", { event: "call.rejected" }, ({ payload }) =>
        handleCallRejected(payload),
      )
      .on("broadcast", { event: "call.ended" }, ({ payload }) =>
        handleCallEnded(payload),
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(
            `[useCall] ✅ Signalisation connectée: ${conversationId}`,
          );
        }
        if (status === "CHANNEL_ERROR") {
          console.error(`[useCall] ❌ Erreur signalisation: ${conversationId}`);
        }
      });

    channelRef.current = channel;

    return () => {
      clearCallTimeout();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [
    conversationId,
    supabase,
    handleCallInitiated,
    handleCallAnswered,
    handleCallRejected,
    handleCallEnded,
    clearCallTimeout,
  ]);

  // ── Actions exposées ───────────────────────────────────────────────────────

  /**
   * Initie un appel vers tous les participants de la conversation
   * (hors l'utilisateur courant).
   */
  const initiateCall = useCallback(
    async (type: CallType) => {
      if (
        callSessionRef.current?.status === "calling" ||
        callSessionRef.current?.status === "connected"
      ) {
        return; // Un appel est déjà en cours
      }

      const sessionId = buildSessionId(conversationId);

      const targetUserIds = participants
        .filter((p) => p.userId !== currentUser.id)
        .map((p) => p.userId);

      if (targetUserIds.length === 0) return;

      const targetUsers = participants
        .filter((p) => p.userId !== currentUser.id)
        .map((p) => p.user);

      const newSession: CallSession = {
        sessionId,
        conversationId,
        type,
        status: "calling",
        caller: currentUser,
        participants: targetUsers,
        startedAt: Date.now(),
      };

      setCallSession(newSession);

      // Broadcaster l'invitation
      broadcast({
        type: "call.initiated",
        sessionId,
        conversationId,
        senderId: currentUser.id,
        callType: type,
        caller: currentUser,
        targetUserIds,
      });

      // Timeout 30s sans réponse → raccrocher automatiquement
      timeoutRef.current = setTimeout(() => {
        const current = callSessionRef.current;
        if (current?.status === "calling") {
          broadcast({
            type: "call.ended",
            sessionId: current.sessionId,
            conversationId,
            senderId: currentUser.id,
            reason: "timeout",
          });
          deleteCallRoom(current.sessionId);
          resetCall();
        }
      }, CALL_TIMEOUT_MS);
    },
    [
      conversationId,
      currentUser,
      participants,
      broadcast,
      deleteCallRoom,
      resetCall,
    ],
  );

  /**
   * Accepte un appel entrant :
   * 1. Génère le token LiveKit
   * 2. Envoie call.answered avec le token (pour que l'appelant sache qu'on a accepté)
   * 3. Passe en status "connected"
   */
  const answerCall = useCallback(async () => {
    const session = callSessionRef.current;
    if (!session || session.status !== "ringing") return;

    clearCallTimeout();

    try {
      const { token, livekitUrl } = await fetchCallToken(session.sessionId);

      broadcast({
        type: "call.answered",
        sessionId: session.sessionId,
        conversationId,
        senderId: currentUser.id,
        livekitToken: token,
        livekitUrl,
      });

      setCallSession((prev) =>
        prev
          ? {
              ...prev,
              status: "connected",
              livekitToken: token,
              livekitUrl,
              connectedAt: Date.now(),
            }
          : prev,
      );
    } catch (err) {
      console.error("[useCall] Erreur token appelé:", err);
      rejectCall();
    }
  }, [
    conversationId,
    currentUser.id,
    clearCallTimeout,
    fetchCallToken,
    broadcast,
  ]);

  /**
   * Refuse un appel entrant.
   */
  const rejectCall = useCallback(() => {
    const session = callSessionRef.current;
    if (!session || session.status !== "ringing") return;

    clearCallTimeout();

    broadcast({
      type: "call.rejected",
      sessionId: session.sessionId,
      conversationId,
      senderId: currentUser.id,
    });

    resetCall();
  }, [conversationId, currentUser.id, clearCallTimeout, broadcast, resetCall]);

  /**
   * Raccroche, quelle que soit la phase de l'appel.
   * Supprime la room LiveKit si l'appel était connecté ou initié par nous.
   */
  const hangUp = useCallback(
    (reason: CallEndReason = "hangup") => {
      const session = callSessionRef.current;
      if (!session) return;

      clearCallTimeout();

      broadcast({
        type: "call.ended",
        sessionId: session.sessionId,
        conversationId,
        senderId: currentUser.id,
        reason,
      });

      // Supprimer la room LiveKit (l'appelant s'en charge, ou le dernier connecté)
      if (
        session.caller.id === currentUser.id ||
        session.status === "connected"
      ) {
        deleteCallRoom(session.sessionId);
      }

      resetCall();
    },
    [
      conversationId,
      currentUser.id,
      clearCallTimeout,
      broadcast,
      deleteCallRoom,
      resetCall,
    ],
  );

  // ── Retour ─────────────────────────────────────────────────────────────────

  const isIncomingCall =
    callSession !== null && callSession.status === "ringing";

  return {
    callSession,
    initiateCall,
    answerCall,
    rejectCall,
    hangUp,
    isIncomingCall,
  };
}
