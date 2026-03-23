// src/lib/livekit.ts
// Génération de tokens LiveKit pour host et viewers
// Compatible avec LiveKit Cloud ET LiveKit local (docker)
//
// Variables d'environnement requises :
//   LIVEKIT_URL=ws://localhost:7880          (local) ou wss://xxx.livekit.cloud
//   LIVEKIT_API_KEY=devkey
//   LIVEKIT_API_SECRET=secret
//
// npm install livekit-server-sdk

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

export interface LiveKitTokenOptions {
  roomName: string;
  userId: string;
  userName: string;
  role: "host" | "viewer";
  /** TTL en secondes (défaut: 4h) */
  ttl?: number;
}

/**
 * Génère un token LiveKit signé
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
    canPublishData: true, // autorise les data channels (chat, events)
    roomAdmin: role === "host",
  });

  return await at.toJwt();
}

/**
 * Termine une room LiveKit côté serveur (quand le host clôture le live)
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
