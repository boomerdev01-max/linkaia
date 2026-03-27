// src/lib/livekit.ts
// Génération de tokens LiveKit pour host/viewer (Lives) et pour les appels audio/vidéo
//
// Variables d'environnement requises :
//   LIVEKIT_URL=ws://localhost:7880          (local) ou wss://xxx.livekit.cloud
//   LIVEKIT_API_KEY=devkey
//   LIVEKIT_API_SECRET=secret
//   NEXT_PUBLIC_LIVEKIT_URL=wss://xxx.livekit.cloud

import { AccessToken, RoomServiceClient } from "livekit-server-sdk";

function getLiveKitConfig() {
  const url = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!url || !apiKey || !apiSecret) {
    throw new Error(
      "❌ Variables LiveKit manquantes : LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET",
    );
  }

  return { url, apiKey, apiSecret };
}

// ─── TOKEN LIVES ──────────────────────────────────────────────────────────────

export interface LiveKitTokenOptions {
  roomName: string;
  userId: string;
  userName: string;
  role: "host" | "viewer";
  /** TTL en secondes (défaut: 4h) */
  ttl?: number;
}

/**
 * Génère un token LiveKit signé pour les Lives/Webinaires
 * - host : canPublish + canSubscribe + canPublishData + roomAdmin
 * - viewer : canSubscribe uniquement (+ canPublishData pour le chat)
 */
export async function generateLiveKitToken({
  roomName,
  userId,
  userName,
  role,
  ttl = 4 * 60 * 60, // 4 heures
}: LiveKitTokenOptions): Promise<string> {
  const { apiKey, apiSecret } = getLiveKitConfig();

  const at = new AccessToken(apiKey, apiSecret, {
    identity: userId,
    name: userName,
    ttl,
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: role === "host",
    canSubscribe: true,
    canPublishData: true,
    roomAdmin: role === "host",
  });

  return await at.toJwt();
}

// ─── TOKEN APPELS AUDIO/VIDÉO ─────────────────────────────────────────────────

export interface CallTokenOptions {
  roomName: string;
  userId: string;
  userName: string;
  /** TTL en secondes (défaut: 2h — suffisant pour un appel) */
  ttl?: number;
}

/**
 * Génère un token LiveKit pour un appel audio/vidéo.
 * Les deux participants (appelant et appelé) peuvent publier et souscrire :
 * c'est un appel bidirectionnel, pas un broadcast.
 */
export async function generateCallToken({
  roomName,
  userId,
  userName,
  ttl = 2 * 60 * 60, // 2 heures
}: CallTokenOptions): Promise<string> {
  const { apiKey, apiSecret } = getLiveKitConfig();

  const at = new AccessToken(apiKey, apiSecret, {
    identity: userId,
    name: userName,
    ttl,
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    // Les deux publient (micro + caméra selon le type d'appel)
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    // Pas de roomAdmin pour les appels — pas besoin de gérer la room
    roomAdmin: false,
  });

  return await at.toJwt();
}

// ─── ROOM MANAGEMENT ─────────────────────────────────────────────────────────

/**
 * Termine une room LiveKit côté serveur.
 * Utilisé pour clôturer un live ou forcer la fin d'un appel.
 */
export async function deleteRoom(roomName: string): Promise<void> {
  const { url, apiKey, apiSecret } = getLiveKitConfig();
  const svc = new RoomServiceClient(url, apiKey, apiSecret);
  try {
    await svc.deleteRoom(roomName);
    console.log(`[LiveKit] Room "${roomName}" supprimée`);
  } catch (err) {
    // La room peut déjà être vide/supprimée, on ne bloque pas
    console.warn(
      `[LiveKit] Impossible de supprimer la room "${roomName}":`,
      err,
    );
  }
}

/** URL WebSocket publique pour le client */
export function getLiveKitPublicUrl(): string {
  const url = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  if (!url) {
    throw new Error("❌ NEXT_PUBLIC_LIVEKIT_URL manquant");
  }
  return url;
}