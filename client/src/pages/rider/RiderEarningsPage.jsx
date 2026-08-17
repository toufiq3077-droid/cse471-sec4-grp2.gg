import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Wallet, Banknote, CalendarDays, TrendingUp, PackageCheck, Award, Loader, RefreshCw, ArrowDownCircle, CircleDollarSign } from 'lucide-react';
import { riderApi } from '../../services/riderApi';

const PAYOUT_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function currency(value) {
  return `৳${Number(value || 0).toLocaleString('en-BD', { maximumFractionDigits: 0 })}`;
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function RiderEarningsPage() {
  const [earnings, setEarnings] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [requesting, setRequesting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [earnRes, payoutRes] = await Promise.all([
        riderApi.getEarnings(),
        riderApi.getPayouts(),
      ]);
      setEarnings(earnRes.earnings);
      setPayouts(payoutRes.payouts || []);
    } catch (err) {
      setError(err.message || 'Failed to load earnings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast.error('Enter a valid payout amount.');
      return;
    }
    setRequesting(true);
    try {
      const res = await riderApi.requestPayout(Number(amount), note);
      toast.success(res.message || 'Payout requested!');
      setAmount('');
      setNote('');
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to request payout');
    } finally {
      setRequesting(false);
    }
  };

  const daily = earnings?.dailyBreakdown || [];
  const maxDay = Math.max(1, ...daily.map((d) => d.amount));
  const available = earnings?.availableBalance || 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-emerald-600 text-white rounded-2xl flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900">Rider Earnings</h1>
            <p className="text-slate-500 text-sm">Track delivery earnings and request payouts.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/rider"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            ← My Deliveries
          </Link>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-rose-100">
          <p className="text-rose-600 font-semibold">{error}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Banknote}
              label="Total Earnings"
              value={currency(earnings?.totalEarnings)}
              sub={`${earnings?.totalDeliveries || 0} completed deliveries`}
              color="bg-emerald-50 text-emerald-700"
            />
            <StatCard
              icon={CalendarDays}
              label="This Week"
              value={currency(earnings?.thisWeek)}
              sub="Earnings since Monday"
              color="bg-blue-50 text-blue-700"
            />
            <StatCard
              icon={TrendingUp}
              label="This Month"
              value={currency(earnings?.thisMonth)}
              sub="Earnings this month"
              color="bg-indigo-50 text-indigo-700"
            />
            <StatCard
              icon={Award}
              label="Avg / Delivery"
              value={currency(earnings?.avgPerDelivery)}
              sub={`${earnings?.totalDeliveries || 0} deliveries total`}
              color="bg-amber-50 text-amber-700"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-5">
                <TrendingUp className="w-5 h-5 text-emerald-600" /> Last 14 Days Earnings
              </h2>
              {daily.length === 0 ? (
                <p className="text-slate-500 text-sm">No earnings data yet.</p>
              ) : (
                <div className="flex items-end gap-1.5 h-44">
                  {daily.map((d) => (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="w-full flex justify-center">
                        <span className="text-[10px] font-bold text-emerald-700 opacity-0 group-hover:opacity-100 transition">
                          {currency(d.amount)}
                        </span>
                      </div>
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-400 min-h-[4px] transition-all group-hover:opacity-80"
                        style={{ height: `${Math.max(4, Math.round((d.amount / maxDay) * 150))}px` }}
                        title={`${d.label}: ${currency(d.amount)} (${d.count} deliveries)`}
                      />
                      <span className="text-[10px] text-slate-400 font-medium">{d.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Request payout */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-fit">
              <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                <CircleDollarSign className="w-5 h-5 text-emerald-600" /> Request Payout
              </h2>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-5">
                <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wider">Available Balance</p>
                <p className="text-3xl font-black text-emerald-700">{currency(available)}</p>
                <p className="text-xs text-emerald-600 mt-1">
                  {earnings?.requestedAmount ? `${currency(earnings.requestedAmount)} already requested` : 'Ready to withdraw'}
                </p>
              </div>
              <form onSubmit={handleRequestPayout} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Amount (৳)</label>
                  <input
                    type="number"
                    min="1"
                    max={available}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Note (optional)</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. bKash withdrawal"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={requesting || !available}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-md shadow-emerald-200 transition text-sm"
                >
                  {requesting ? <Loader className="w-4 h-4 animate-spin" /> : <ArrowDownCircle className="w-4 h-4" />}
                  {requesting ? 'Requesting...' : 'Request Payout'}
                </button>
              </form>
            </div>
          </div>

          {/* Payout history */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Wallet className="w-5 h-5 text-emerald-600" /> Payout History
            </h2>
            {payouts.length === 0 ? (
              <p className="text-slate-500 text-sm py-6 text-center">No payouts yet. Request your first payout when you have earnings.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      <th className="pb-3 pr-4">Amount</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 pr-4">Note</th>
                      <th className="pb-3">Requested On</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {payouts.map((p) => (
                      <tr key={p._id}>
                        <td className="py-3 pr-4 font-bold text-slate-900">{currency(p.amount)}</td>
                        <td className="py-3 pr-4">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize ${PAYOUT_STYLES[p.status] || ''}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-slate-600">{p.note || '—'}</td>
                        <td className="py-3 text-slate-500">{formatDate(p.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-500">
            <PackageCheck className="w-4 h-4 shrink-0 text-emerald-600" />
            Earnings are calculated per completed delivery based on the route distance (base ৳30 + ৳7 per km, minimum ৳40).
            Payouts complete instantly and are recorded for demonstration purposes only — no real money is transferred.
          </div>
        </div>
      )}
    </div>
  );
}
