"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface LiaChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export function useLiaChat() {
  const [messages, setMessages] = useState<LiaChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Charger l'historique au montage
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/lia/chat");
        if (!res.ok) throw new Error("Erreur chargement");
        const data = await res.json();
        setMessages(data.messages || []);
      } catch {
        // Pas d'historique = première visite, c'est OK
      } finally {
        setIsLoadingHistory(false);
      }
    }
    loadHistory();
  }, []);

  // Auto-scroll vers le bas
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    // Ajouter le message user immédiatement (optimistic UI)
    const tempUserMsg: LiaChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/lia/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur inconnue");
      }

      // Ajouter la réponse de Lia
      const liaMsg: LiaChatMessage = {
        id: `lia-${Date.now()}`,
        role: "assistant",
        content: data.reply,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, liaMsg]);
    } catch (err: any) {
      setError(err.message || "Lia ne répond pas. Vérifie qu'Ollama est lancé.");
      // Retirer le message optimiste en cas d'erreur
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  return {
    messages,
    input,
    setInput,
    isLoading,
    isLoadingHistory,
    error,
    sendMessage,
    handleKeyDown,
    bottomRef,
  };
}