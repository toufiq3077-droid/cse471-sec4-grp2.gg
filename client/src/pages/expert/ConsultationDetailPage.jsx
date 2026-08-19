import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Stethoscope,
  CreditCard,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { consultationApi } from "../../services/consultationApi";
import { useAuth } from "../../context/AuthContext";
import ConsultationChat from "../../components/expert/ConsultationChat";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-800",
};

const PAYMENT_METHODS = [
  { id: "mock_bkash", label: "bKash (mock)", desc: "Simulated instant payment — no real charge" },
  { id: "cash_on_delivery", label: "Pay Later", desc: "Mark as cash / pay-later, verified manually by admin" },
];

export default function ConsultationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("mock_bkash");
  const [paying, setPaying] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await consultationApi.getById(id);
      setData(res);
    } catch (err) {
      toast.error(err.message || "Failed to load consultation.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePay = async () => {
    setPaying(true);
    try {
      const res = await consultationApi.pay(id, paymentMethod);
      toast.success(res.message);
      fetchData();
    } catch (err) {
      toast.error(err.message || "Payment failed.");
    } finally {
      setPaying(false);
    }
  };

  const handleStatusChange = async (status) => {
    setUpdatingStatus(true);
    try {
      const res = await consultationApi.updateStatus(id, status);
      toast.success(res.message);
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to update status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-green-600" size={32} />
      </div>
    );
  }

  if (!data?.consultation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
        <p className="text-gray-500">Consultation not found.</p>
        <Link to="/consultations" className="text-green-600 font-medium">Back to history</Link>
      </div>
    );
  }

  const { consultation, viewerRole, chatEnabled } = data;
  const expert = consultation.expertId || {};
  const farmer = consultation.farmerId || {};
  const isFarmer = viewerRole === "farmer";
  const isExpert = viewerRole === "expert";
  const isUnpaid = consultation.payment?.status !== "paid";
  const isCancelled = consultation.status === "cancelled";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <button
          onClick={() => navigate("/consultations")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-600 mb-2"
        >
          <ArrowLeft size={16} /> Back to consultation history
        </button>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-bold text-gray-800">Consultation Details</h1>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${STATUS_STYLES[consultation.status] || "bg-gray-100 text-gray-700"}`}>
            {consultation.status}
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column: details + payment + admin/expert controls */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="font-bold text-gray-800 mb-4">Booking Info</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Stethoscope size={16} className="text-purple-500" />
                Expert: <span className="font-medium text-gray-900">{expert.name || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <User size={16} className="text-emerald-500" />
                Farmer: <span className="font-medium text-gray-900">{farmer.name || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar size={16} className="text-blue-500" />
                {new Date(consultation.consultationDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock size={16} className="text-amber-500" />
                {consultation.timeSlot}
              </div>
              {consultation.notes && (
                <div className="pt-2 border-t border-gray-100 text-gray-600">
                  <p className="text-xs uppercase tracking-wide font-semibold text-gray-400 mb-1">Note</p>
                  <p>{consultation.notes}</p>
                </div>
              )}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-gray-500">Consultation fee</span>
                <span className="font-bold text-green-700">${consultation.fee}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Payment status</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                  consultation.payment?.status === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}>
                  {consultation.payment?.status || "unpaid"}
                </span>
              </div>
              {consultation.payment?.transactionId && (
                <p className="text-xs text-gray-400 break-all">Txn: {consultation.payment.transactionId}</p>
              )}
            </div>
          </div>

          {/* Payment (farmer only, if unpaid & not cancelled) */}
          {isFarmer && isUnpaid && !isCancelled && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
                <CreditCard size={18} className="text-green-600" /> Complete Payment
              </h2>
              <p className="text-xs text-gray-500 mb-4">Chat with the expert unlocks right after payment is verified.</p>
              <div className="space-y-2 mb-4">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                      paymentMethod === m.id ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-green-300"
                    }`}
                  >
                    <p className="font-semibold text-gray-800">{m.label}</p>
                    <p className="text-xs text-gray-500">{m.desc}</p>
                  </button>
                ))}
              </div>
              <button
                onClick={handlePay}
                disabled={paying}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {paying ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                {paying ? "Verifying payment..." : `Pay $${consultation.fee}`}
              </button>
            </div>
          )}

          {/* Expert / admin status controls */}
          {(isExpert || viewerRole === "admin") && !isCancelled && consultation.status !== "completed" && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="font-bold text-gray-800 mb-3">Update Status</h2>
              <div className="flex flex-wrap gap-2">
                {consultation.status === "pending" && (
                  <button
                    onClick={() => handleStatusChange("confirmed")}
                    disabled={updatingStatus}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50"
                  >
                    Confirm
                  </button>
                )}
                {consultation.status === "confirmed" && (
                  <button
                    onClick={() => handleStatusChange("completed")}
                    disabled={updatingStatus}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-50"
                  >
                    Mark Completed
                  </button>
                )}
                <button
                  onClick={() => handleStatusChange("cancelled")}
                  disabled={updatingStatus}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm font-medium disabled:opacity-50 flex items-center gap-1.5"
                >
                  <XCircle size={14} /> Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right column: chat */}
        <div className="lg:col-span-3">
          <ConsultationChat
            consultationId={id}
            chatEnabled={!!chatEnabled}
            viewerRole={viewerRole}
            status={consultation.status}
            onEnded={fetchData}
          />
        </div>
      </div>
    </div>
  );
}
