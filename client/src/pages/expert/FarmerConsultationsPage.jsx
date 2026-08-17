import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar,
  Clock,
  Stethoscope,
  MessageCircle,
  Lock,
  Loader2,
  RefreshCw,
  ArrowLeft,
  History,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { consultationApi } from "../../services/consultationApi";
import ConsultationChat from "../../components/expert/ConsultationChat";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-800",
};

function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function FarmerConsultationsPage() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await consultationApi.getMyConsultations();
      const list = res.consultations || [];
      setConsultations(list);
      setSelectedId((prev) => {
        if (prev && list.some((c) => c._id === prev)) return prev;
        const firstPaid = list.find((c) => c.payment?.status === "paid");
        return (firstPaid || list[0])?._id || null;
      });
    } catch (err) {
      setError(err.message || "Failed to load consultations.");
      toast.error(err.message || "Failed to load consultations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selected = useMemo(
    () => consultations.find((c) => c._id === selectedId) || null,
    [consultations, selectedId]
  );

  const listPanel = (
    <div className="space-y-2">
      {consultations.map((c) => {
        const chatUnlocked = c.payment?.status === "paid";
        const isActive = c._id === selectedId;
        return (
          <button
            key={c._id}
            onClick={() => setSelectedId(c._id)}
            className={`w-full text-left rounded-2xl p-4 border transition ${
              isActive
                ? "bg-emerald-50 border-emerald-300 shadow-sm"
                : "bg-white border-slate-200 hover:border-emerald-200 hover:shadow-sm"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 truncate">
                  {c.expertId?.name || "Expert"}
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(c.consultationDate)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {c.timeSlot}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                      STATUS_STYLES[c.status] || "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {c.status}
                  </span>
                  {chatUnlocked ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      <MessageCircle className="w-3 h-3" /> Unlocked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      <Lock className="w-3 h-3" /> Payment needed
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Chat with Experts
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Experts you have booked. Complete payment on a consultation to
            unlock its chat.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/consultations"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl px-3 py-2 hover:bg-slate-50 transition"
          >
            <History className="w-4 h-4" /> History
          </Link>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl px-3 py-2 hover:bg-slate-50 transition"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-6 text-sm">
          {error}
        </div>
      ) : consultations.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500">
          No consultations yet. Book an expert to start a conversation.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <div className={selected ? "hidden lg:block" : "block"}>
            {listPanel}
          </div>

          <div className={selected ? "block" : "hidden lg:block"}>
            {selected ? (
              <div>
                <div className="flex items-center gap-3 mb-3 lg:hidden">
                  <button
                    onClick={() => setSelectedId(null)}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to list
                  </button>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-bold text-slate-900">
                    {selected.expertId?.name || "Expert"}
                  </p>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                      STATUS_STYLES[selected.status] ||
                      "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {selected.status}
                  </span>
                </div>
                <ConsultationChat
                  consultationId={selected._id}
                  chatEnabled={selected.payment?.status === "paid"}
                  viewerRole="farmer"
                  status={selected.status}
                  onEnded={fetchData}
                />
              </div>
            ) : (
              <div className="hidden lg:flex items-center justify-center h-[520px] bg-white border border-slate-200 rounded-2xl text-slate-400">
                Select a conversation to start chatting.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
