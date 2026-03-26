export function LiaTypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4">
      {/* Avatar Lia */}
      <div className="w-7 h-7 rounded-full bg-linear-to-br from-[#0F4C5C] to-[#1a7a8a] flex items-center justify-center shrink-0 text-xs font-bold text-white">
        L
      </div>
      {/* Bulles animées */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          <span
            className="w-2 h-2 rounded-full bg-[#0F4C5C] opacity-60 animate-bounce"
            style={{ animationDelay: "0ms", animationDuration: "1s" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-[#0F4C5C] opacity-60 animate-bounce"
            style={{ animationDelay: "200ms", animationDuration: "1s" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-[#0F4C5C] opacity-60 animate-bounce"
            style={{ animationDelay: "400ms", animationDuration: "1s" }}
          />
        </div>
      </div>
    </div>
  );
}