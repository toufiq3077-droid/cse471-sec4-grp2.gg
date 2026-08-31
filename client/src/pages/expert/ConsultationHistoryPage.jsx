import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  History,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Search,
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Wallet,
  ClipboardList,
  MessageCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { consultationApi } from "../../services/consultationApi";
import { useAuth } from "../../context/AuthContext";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-800",
};

const STATUS_FILTERS = ["all", "pending", "confirmed", "completed", "cancelled"];

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ConsultationHistoryPage() {
  const { user } = useAuth();
  const isExpert = user?.role === "expert";
  const theme = isExpert
    ? {
        accent: "purple",
        iconBg: "bg-purple-600",
        chip: "bg-purple-50 text-purple-700 border-purple-200",
        ring: "focus:ring-purple-500 focus:border-purple-500",
        activeTab: "bg-purple-600 text-white border-purple-600",
      }
    : {
        accent: "emerald",
        iconBg: "bg-emerald-600",
        chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
        ring: "focus:ring-emerald-500 focus:border-emerald-500",
        activeTab: "bg-emerald-600 text-white border-emerald-600",
      };

  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = isExpert
        ? await consultationApi.getExpertConsultations()
        : await consultationApi.getMyConsultations();
      setConsultations(res.consultations || []);
    } catch (err) {
      setError(err.message || "Failed to load consultation history.");
      toast.error(err.message || "Failed to load consultation history.");
    } finally {
      setLoading(false);
    }
  }, [isExpert]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo(() => {
    const total = consultations.length;
    const completed = consultations.filter((c) => c.status === "completed").length;
    const upcoming = consultations.filter(
      (c) => c.status === "pending" || c.status === "confirmed"
    ).length;
    const cancelled = consultations.filter((c) => c.status === "cancelled").length;
    return { total, completed, upcoming, cancelled };
  }, [consultations]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return consultations.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!term) return true;
      const participantName = isExpert
        ? c.farmerId?.name || ""
        : c.expertId?.name || "";
      return (
        participantName.toLowerCase().includes(term) ||
        (c.notes || "").toLowerCase().includes(term) ||
        (c.timeSlot || "").toLowerCase().includes(term)
      );
    });
  }, [consultations, statusFilter, search, isExpert]);

  const handleCancel = async (id) => {
    setBusyId(id);
    try {
      // Farmers use the dedicated cancel endpoint; experts cancel via the
      // status-update endpoint (only farmers/admins are allowed to hit
      // /:id/cancel on the server).
      const res = isExpert
        ? await consultationApi.updateStatus(id, "cancelled")
        : await consultationApi.cancel(id);
      toast.success(res.message || "Consultation cancelled.");
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to cancel consultation.");
    } finally {
      setBusyId(null);
    }
  };

  const handleStatusChange = async (id, status) => {
    setBusyId(id);
    try {
      const res = await consultationApi.updateStatus(id, status);
      toast.success(res.message || "Status updated.");
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to update status.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 ${theme.iconBg} text-white rounded-2xl flex items-center justify-center shrink-0`}>
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Consultation History
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              {isExpert
                ? "Every consultation you've had with farmers — past and upcoming."
                : "Every consultation you've booked with experts — past and upcoming."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={isExpert ? "/expert/consultations" : "/farmer/consultations"}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl px-3 py-2 hover:bg-slate-50 transition"
          >
            <MessageCircle className="w-4 h-4" /> Chats
          </Link>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl px-3 py-2 hover:bg-slate-50 transition"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Upcoming</p>
          <p className="text-2xl font-black text-blue-700 mt-1">{stats.upcoming}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Completed</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{stats.completed}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cancelled</p>
          <p className="text-2xl font-black text-rose-700 mt-1">{stats.cancelled}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`shrink-0 text-xs font-semibold px-3 py-2 rounded-xl border capitalize transition ${
                statusFilter === s
                  ? theme.activeTab
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isExpert ? "Search farmer, notes, time..." : "Search expert, notes, time..."}
            className={`w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 ${theme.ring}`}
          />
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
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500">
          <ClipboardList className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          {consultations.length === 0
            ? isExpert
              ? "No consultations yet. Once a farmer books you, it will show up here."
              : "No consultations yet. Book an expert to get started."
            : "No consultations match your filters."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const participant = isExpert ? c.farmerId : c.expertId;
            const canCancel =
              !isExpert && (c.status === "pending" || c.status === "confirmed");
            const canManage = isExpert && c.status !== "cancelled" && c.status !== "completed";
            const isBusy = busyId === c._id;

            return (
              <div
                key={c._id}
                className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 hover:shadow-sm hover:border-slate-300 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <Link to={`/consultations/${c._id}`} className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-xl ${theme.chip} border flex items-center justify-center shrink-0`}>
                      {isExpert ? <User className="w-5 h-5" /> : <Stethoscope className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 truncate">
                        {participant?.name || (isExpert ? "Farmer" : "Expert")}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(c.consultationDate)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {c.timeSlot}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Wallet className="w-3.5 h-3.5" />
                          ${c.fee}
                        </span>
                      </div>
                      {c.notes && (
                        <p className="text-xs text-slate-500 mt-2 line-clamp-1">
                          Note: {c.notes}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                            STATUS_STYLES[c.status] || "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {c.status}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                            c.payment?.status === "paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {c.payment?.status || "unpaid"}
                        </span>
                      </div>
                    </div>
                  </Link>

                  {(canCancel || canManage) && (
                    <div className="flex items-center gap-2 shrink-0 sm:pl-3">
                      {canManage && c.status === "pending" && (
                        <button
                          disabled={isBusy}
                          onClick={() => handleStatusChange(c._id, "confirmed")}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Confirm
                        </button>
                      )}
                      {canManage && c.status === "confirmed" && (
                        <button
                          disabled={isBusy}
                          onClick={() => handleStatusChange(c._id, "completed")}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                        </button>
                      )}
                      {(canCancel || canManage) && (
                        <button
                          disabled={isBusy}
                          onClick={() => handleCancel(c._id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancel
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
