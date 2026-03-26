"use client";

import { useRef, useEffect } from "react";
import { X, Send, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { useLiaChat } from "@/hooks/useLiaChat";
import { LiaMessage } from "./LiaMessage";
import { LiaTypingIndicator } from "./LiaTypingIndicator";

interface Props {
  onClose: () => void;
}

export function LiaChatWindow({ onClose }: Props) {
  const {
    messages,
    input,
    setInput,
    isLoading,
    isLoadingHistory,
    error,
    sendMessage,
    handleKeyDown,
    bottomRef,
  } = useLiaChat();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [input]);

  const isFirstVisit = !isLoadingHistory && messages.length === 0;

  return (
    <div className="flex flex-col h-full bg-gray-50">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="bg-linear-to-r from-[#0F4C5C] to-[#1a7a8a] px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center font-bold text-white text-sm">
              L
            </div>
            {/* Indicateur "en ligne" */}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#0F4C5C]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-white font-semibold text-sm">Lia</span>
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            </div>
            <p className="text-white/70 text-xs">Assistante Linkaïa • En ligne</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* ── Messages ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0">

        {/* Chargement de l'historique */}
        {isLoadingHistory && (
          <div className="flex justify-center py-8">
            <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        )}

        {/* Message de bienvenue (première visite) */}
        {isFirstVisit && (
          <div className="flex items-end gap-2 mb-4">
            <div className="w-7 h-7 rounded-full bg-linear-to-br from-[#0F4C5C] to-[#1a7a8a] flex items-center justify-center shrink-0 text-xs font-bold text-white">
              L
            </div>
            <div className="max-w-[80%] bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3">
              <p className="text-sm text-gray-800 leading-relaxed">
                Salut ! 👋 Je suis <strong>Lia</strong>, ton assistante sur Linkaïa.
                <br /><br />
                Je peux t'aider avec l'app, te donner des conseils sur tes relations, ou simplement discuter de tout et rien ! 😊
              </p>
            </div>
          </div>
        )}

        {/* Liste des messages */}
        {messages.map((msg) => (
          <LiaMessage key={msg.id} message={msg} />
        ))}

        {/* Indicateur "Lia écrit..." */}
        {isLoading && <LiaTypingIndicator />}

        {/* Erreur */}
        {error && (
          <div className="flex items-start gap-2 mb-4 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* Suggestions rapides (première visite) */}
        {isFirstVisit && !isLoading && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-gray-400 text-center mb-3">Suggestions</p>
            {[
              "Comment améliorer mon profil ? 🎯",
              "Explique-moi le système de L-Gems 💎",
              "Donne-moi des conseils pour les rencontres ❤️",
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => {
                  setInput(suggestion);
                  setTimeout(() => textareaRef.current?.focus(), 50);
                }}
                className="w-full text-left text-xs bg-white border border-gray-200 hover:border-[#0F4C5C] hover:bg-[#0F4C5C]/5 rounded-xl px-3 py-2.5 text-gray-600 transition-all"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Ancre de scroll */}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ───────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-gray-100 bg-white px-3 py-3">
        <div className="flex items-end gap-2 bg-gray-50 rounded-2xl border border-gray-200 px-3 py-2 focus-within:border-[#0F4C5C] focus-within:ring-1 focus-within:ring-[#0F4C5C]/20 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Lia..."
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none outline-none min-h-6 max-h-30 py-0.5 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="w-8 h-8 rounded-xl bg-[#0F4C5C] hover:bg-[#0d3d4a] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0 transition-all active:scale-95"
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-300 mt-2">
          Lia peut faire des erreurs · Propulsé par Linkaïa AI
        </p>
      </div>
    </div>
  );
}