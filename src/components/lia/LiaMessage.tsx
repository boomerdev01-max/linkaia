import { LiaChatMessage } from "@/hooks/useLiaChat";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  message: LiaChatMessage;
}

export function LiaMessage({ message }: Props) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[75%]">
          <div className="bg-[#0F4C5C] text-white rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          </div>
          <p className="text-[10px] text-gray-400 text-right mt-1 px-1">
            {formatTime(message.createdAt)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 mb-4">
      {/* Avatar Lia */}
      <div className="w-7 h-7 rounded-full bg-linear-to-br from-[#0F4C5C] to-[#1a7a8a] flex items-center justify-center shrink-0 text-xs font-bold text-white shadow-sm">
        L
      </div>
      <div className="max-w-[75%]">
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm px-4 py-2.5">
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
        <p className="text-[10px] text-gray-400 mt-1 px-1">
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}