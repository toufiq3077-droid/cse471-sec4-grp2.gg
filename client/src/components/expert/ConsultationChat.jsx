import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Lock, ShieldCheck, PhoneOff, CheckCircle2 } from "lucide-react";
import { consultationApi } from "../../services/consultationApi";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const ROLE_LABEL = { farmer: "the farmer", expert: "the expert", admin: "an admin" };

export default function ConsultationChat({
  consultationId,
  chatEnabled,
  viewerRole,
  status,
  onEnded,
}) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [ending, setEnding] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [ended, setEnded] = useState(status === "completed" || status === "cancelled");
  const bottomRef = useRef(null);

  useEffect(() => {
    setEnded(status === "completed" || status === "cancelled");
  }, [status]);

  const loadMessages = useCallback(async () => {
    if (!chatEnabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await consultationApi.getMessages(consultationId);
      setMessages(res.messages || []);
    } catch (err) {
      toast.error(err.message || "Failed to load chat.");
    } finally {
      setLoading(false);
    }
  }, [consultationId, chatEnabled]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  // Live updates via the already-authenticated socket connection
  useEffect(() => {
    if (!socket || !chatEnabled) return;

    const onMessage = (payload) => {
      if (String(payload.consultationId) !== String(consultationId)) return;
      setMessages((prev) => [...prev, payload.message]);
    };

    socket.on("consultation_message", onMessage);
    return () => socket.off("consultation_message", onMessage);
  }, [socket, chatEnabled, consultationId]);

  // Live "who ended the consultation" popup, delivered to both participants.
  useEffect(() => {
    if (!socket) return;

    const onConsultationEnded = (payload) => {
      if (String(payload.consultationId) !== String(consultationId)) return;
      setEnded(true);

      // The person who clicked "End Consultation" already sees a local
      // success toast from the API call — only pop up a notice here for
      // the *other* participant so it isn't shown twice.
      if (payload.endedBy !== viewerRole) {
        const who = payload.endedByName || ROLE_LABEL[payload.endedBy] || "The other participant";
        toast(
          `${who} ended the consultation. It has been marked as completed.`,
          { icon: "🔒", duration: 7000 }
        );
      }

      onEnded?.();
    };

    socket.on("consultation_ended", onConsultationEnded);
    return () => socket.off("consultation_ended", onConsultationEnded);
  }, [socket, consultationId, viewerRole, onEnded]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending || ended) return;

    setSending(true);
    setText("");
    try {
      const res = await consultationApi.sendMessage(consultationId, trimmed);
      setMessages((prev) => [...prev, res.message]);
    } catch (err) {
      toast.error(err.message || "Failed to send message.");
      setText(trimmed);
    } finally {
      setSending(false);
    }
  };

  const handleEndClick = () => {
    if (!confirmEnd) {
      setConfirmEnd(true);
      return;
    }
    endConsultationNow();
  };

  const endConsultationNow = async () => {
    setEnding(true);
    try {
      const res = await consultationApi.end(consultationId);
      toast.success(res.message || "Consultation ended.");
      setEnded(true);
      onEnded?.();
    } catch (err) {
      toast.error(err.message || "Failed to end consultation.");
    } finally {
      setEnding(false);
      setConfirmEnd(false);
    }
  };

  if (!chatEnabled) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col items-center justify-center text-center gap-2">
        <Lock size={28} className="text-gray-300" />
        <p className="font-semibold text-gray-700">Chat is locked</p>
        <p className="text-sm text-gray-500 max-w-xs">
          Secure consultation chat unlocks automatically once payment for this consultation has been verified.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 flex flex-col h-[520px] overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-emerald-50 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
          <p className="text-xs font-semibold text-emerald-800 truncate">
            {ended ? "Consultation ended" : "Secure consultation chat \u00b7 payment verified"}
          </p>
        </div>
        {!ended && (
          <button
            onClick={handleEndClick}
            onBlur={() => setConfirmEnd(false)}
            disabled={ending}
            className={`flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
              confirmEnd
                ? "bg-rose-600 hover:bg-rose-700 text-white"
                : "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
            }`}
            title="End this consultation for both participants"
          >
            <PhoneOff size={14} />
            {ending ? "Ending..." : confirmEnd ? "Confirm end?" : "End Consultation"}
          </button>
        )}
      </div>

      {ended && (
        <div className="px-5 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2 flex-shrink-0">
          <CheckCircle2 size={14} className="text-emerald-600" />
          <p className="text-xs text-slate-600">
            This consultation has ended and is marked as completed. The chat history stays available below.
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <p className="text-center text-sm text-gray-400 py-10">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-10">
            No messages yet. Say hello to start the consultation.
          </p>
        ) : (
          messages.map((m) => {
            const isMine = m.senderRole === viewerRole;
            return (
              <div key={m._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    isMine
                      ? "bg-green-600 text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? "text-green-100" : "text-gray-400"}`}>
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-gray-100 p-3 flex items-center gap-2 flex-shrink-0">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={ended ? "This consultation has ended." : "Type a message..."}
          maxLength={2000}
          disabled={ended}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-gray-50 disabled:text-gray-400"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending || ended}
          className="p-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-xl transition-colors flex-shrink-0"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
