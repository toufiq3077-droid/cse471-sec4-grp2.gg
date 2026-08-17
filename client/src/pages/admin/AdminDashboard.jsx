import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../services/adminApi';
import toast from 'react-hot-toast';
import { Users, Sprout, ShoppingBag, Stethoscope, Truck, ShieldAlert, RefreshCw, CheckCircle, XCircle, Search, ShieldCheck, Clock, DollarSign, TrendingUp, Wallet } from 'lucide-react';

export default function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pendingExperts, setPendingExperts] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [pendingPaymentsLoading, setPendingPaymentsLoading] = useState(true);
  const [paymentActionId, setPaymentActionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expertsLoading, setExpertsLoading] = useState(true);
  const [expertActionId, setExpertActionId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsRes = await adminApi.getStats(token);
      setStats(statsRes.stats);

      const usersRes = await adminApi.getAllUsers(token);
      setUsers(usersRes.users);
    } catch (error) {
      toast.error(error.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingExperts = async () => {
    setExpertsLoading(true);
    try {
      const res = await adminApi.getPendingExperts(token);
      setPendingExperts(res.experts || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load pending experts');
    } finally {
      setExpertsLoading(false);
    }
  };

  const fetchRevenue = async () => {
    setRevenueLoading(true);
    try {
      const res = await adminApi.getConsultationRevenue(token);
      setRevenue(res.revenue);
    } catch (error) {
      toast.error(error.message || 'Failed to load consultation revenue');
    } finally {
      setRevenueLoading(false);
    }
  };

  const fetchPendingPayments = async () => {
    setPendingPaymentsLoading(true);
    try {
      const res = await adminApi.getPendingCashPayments(token);
      setPendingPayments(res.consultations || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load pending pay-later approvals');
    } finally {
      setPendingPaymentsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
      fetchPendingExperts();
      fetchRevenue();
      fetchPendingPayments();
    }
  }, [token]);

  const handleToggleVerify = async (userId, currentName) => {
    try {
      const res = await adminApi.toggleVerifyUser(userId, token);
      toast.success(res.message);
      setUsers(users.map((u) => (u._id === userId ? { ...u, isVerified: res.user.isVerified } : u)));
    } catch (error) {
      toast.error(error.message || 'Failed to update user verification');
    }
  };

  const handleExpertDecision = async (expertId, decision) => {
    setExpertActionId(expertId);
    try {
      const res = decision === 'approve'
        ? await adminApi.approveExpert(expertId, token)
        : await adminApi.rejectExpert(expertId, token);
      toast.success(res.message || `Expert ${decision}d`);
      setPendingExperts((prev) => prev.filter((e) => e._id !== expertId));
    } catch (error) {
      toast.error(error.message || `Failed to ${decision} expert`);
    } finally {
      setExpertActionId(null);
    }
  };

  const handleApprovePayment = async (consultationId) => {
    setPaymentActionId(consultationId);
    try {
      const res = await adminApi.approveCashPayment(consultationId, token);
      toast.success(res.message || 'Payment approved. Chat is now unlocked.');
      setPendingPayments((prev) => prev.filter((c) => c._id !== consultationId));
      fetchRevenue();
    } catch (error) {
      toast.error(error.message || 'Failed to approve payment');
    } finally {
      setPaymentActionId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 bg-rose-500/20 text-rose-300 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 border border-rose-500/30">
            <ShieldAlert className="w-4 h-4" /> Admin Control Panel
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">Khet-i Ecosystem Metrics & Users</h1>
          <p className="text-slate-400 text-sm mt-1">Manage platform users, verify credentials, and monitor system activity</p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="self-start md:self-auto bg-slate-800 hover:bg-slate-700 text-white font-medium px-4 py-2.5 rounded-xl border border-slate-700 transition flex items-center gap-2 text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <div className="p-2.5 bg-slate-100 text-slate-800 rounded-xl mb-2">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-slate-900">{stats?.totalUsers || 0}</span>
          <span className="text-xs text-slate-500 font-medium">Total Users</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl mb-2">
            <Sprout className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-slate-900">{stats?.farmers || 0}</span>
          <span className="text-xs text-slate-500 font-medium">Farmers</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <div className="p-2.5 bg-blue-100 text-blue-800 rounded-xl mb-2">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-slate-900">{stats?.buyers || 0}</span>
          <span className="text-xs text-slate-500 font-medium">Buyers</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <div className="p-2.5 bg-purple-100 text-purple-800 rounded-xl mb-2">
            <Stethoscope className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-slate-900">{stats?.experts || 0}</span>
          <span className="text-xs text-slate-500 font-medium">Experts</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl mb-2">
            <Truck className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-slate-900">{stats?.riders || 0}</span>
          <span className="text-xs text-slate-500 font-medium">Delivery Riders</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <div className="p-2.5 bg-rose-100 text-rose-800 rounded-xl mb-2">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-slate-900">{stats?.admins || 0}</span>
          <span className="text-xs text-slate-500 font-medium">Admins</span>
        </div>
      </div>

      {/* Consultation Revenue Monitoring */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-500" /> Consultation Revenue
            </h2>
            <p className="text-xs text-slate-500">Monitor revenue collected from paid farmer–expert consultations</p>
          </div>
          <button
            onClick={fetchRevenue}
            disabled={revenueLoading}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${revenueLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {revenueLoading ? (
          <p className="text-sm text-slate-500 py-6 text-center">Loading revenue data...</p>
        ) : !revenue ? (
          <p className="text-sm text-slate-500 py-6 text-center">No revenue data available.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex flex-col items-center text-center">
                <TrendingUp className="w-5 h-5 text-emerald-600 mb-1.5" />
                <span className="text-2xl font-black text-emerald-800">${revenue.totalRevenue}</span>
                <span className="text-xs text-emerald-700 font-medium">Total Revenue</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col items-center text-center">
                <CheckCircle className="w-5 h-5 text-slate-600 mb-1.5" />
                <span className="text-2xl font-black text-slate-900">{revenue.paidConsultations}</span>
                <span className="text-xs text-slate-500 font-medium">Paid Consultations</span>
              </div>
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex flex-col items-center text-center">
                <Clock className="w-5 h-5 text-amber-600 mb-1.5" />
                <span className="text-2xl font-black text-amber-800">{revenue.pendingPaymentCount}</span>
                <span className="text-xs text-amber-700 font-medium">Awaiting Payment</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col items-center text-center">
                <ShieldCheck className="w-5 h-5 text-slate-600 mb-1.5" />
                <span className="text-2xl font-black text-slate-900">{revenue.statusBreakdown?.completed || 0}</span>
                <span className="text-xs text-slate-500 font-medium">Completed</span>
              </div>
            </div>

            {revenue.topExperts?.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-3">Top Earning Experts</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="py-2 px-3">Expert</th>
                        <th className="py-2 px-3">Specialization</th>
                        <th className="py-2 px-3">Consultations</th>
                        <th className="py-2 px-3">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {revenue.topExperts.map((e) => (
                        <tr key={e.expertId}>
                          <td className="py-2 px-3 font-medium text-slate-800">{e.expertName || 'Unknown'}</td>
                          <td className="py-2 px-3 text-slate-500">{e.specialization || '—'}</td>
                          <td className="py-2 px-3 text-slate-600">{e.consultations}</td>
                          <td className="py-2 px-3 font-bold text-emerald-700">${e.revenue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Pending Pay-Later (Cash on Delivery) Payment Approvals */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-amber-500" /> Pending Pay-Later Approvals
            </h2>
            <p className="text-xs text-slate-500">
              Farmers who chose "Pay Later" — approve once cash payment is confirmed to unlock their consultation chat
            </p>
          </div>
          <button
            onClick={fetchPendingPayments}
            disabled={pendingPaymentsLoading}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${pendingPaymentsLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {pendingPaymentsLoading ? (
          <p className="text-sm text-slate-500 py-6 text-center">Loading pending payments...</p>
        ) : pendingPayments.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">No pay-later consultations waiting for approval.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-2 px-3">Farmer</th>
                  <th className="py-2 px-3">Expert</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Fee</th>
                  <th className="py-2 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingPayments.map((c) => (
                  <tr key={c._id}>
                    <td className="py-2 px-3 font-medium text-slate-800">{c.farmerId?.name || 'Unknown'}</td>
                    <td className="py-2 px-3 text-slate-600">{c.expertId?.name || 'Unknown'}</td>
                    <td className="py-2 px-3 text-slate-500">
                      {new Date(c.consultationDate).toLocaleDateString()} &middot; {c.timeSlot}
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-700">${c.fee}</td>
                    <td className="py-2 px-3">
                      <button
                        onClick={() => handleApprovePayment(c._id)}
                        disabled={paymentActionId === c._id}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        {paymentActionId === c._id ? 'Approving...' : 'Approve Payment'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Expert Applications */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" /> Pending Expert Applications
            </h2>
            <p className="text-xs text-slate-500">Approve or reject experts waiting for verification</p>
          </div>
          <button
            onClick={fetchPendingExperts}
            disabled={expertsLoading}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${expertsLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {expertsLoading ? (
          <p className="text-sm text-slate-500 py-6 text-center">Loading pending experts...</p>
        ) : pendingExperts.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">No pending expert applications right now.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingExperts.map((expert) => (
              <div key={expert._id} className="border border-slate-200 rounded-2xl p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{expert.name}</p>
                    <p className="text-xs text-slate-500">{expert.specialization} · {expert.experience} yrs exp</p>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 capitalize">
                    {expert.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-3">{expert.bio}</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleExpertDecision(expert._id, 'approve')}
                    disabled={expertActionId === expert._id}
                    className="flex-1 text-xs font-semibold px-3 py-2 rounded-xl border border-emerald-600 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => handleExpertDecision(expert._id, 'reject')}
                    disabled={expertActionId === expert._id}
                    className="flex-1 text-xs font-semibold px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Management Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Registered Users (MongoDB)</h2>
            <p className="text-xs text-slate-500">View and verify all registered platform accounts</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Roles</option>
              <option value="farmer">Farmer</option>
              <option value="buyer">Buyer</option>
              <option value="expert">Expert</option>
              <option value="rider">Rider</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((userItem) => (
                  <tr key={userItem._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{userItem.name}</div>
                      <div className="text-xs text-slate-500">{userItem.email}</div>
                    </td>
                    <td className="py-3.5 px-4 capitalize">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          userItem.role === 'admin'
                            ? 'bg-rose-100 text-rose-800'
                            : userItem.role === 'expert'
                            ? 'bg-purple-100 text-purple-800'
                            : userItem.role === 'buyer'
                            ? 'bg-blue-100 text-blue-800'
                            : userItem.role === 'rider'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {userItem.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">
                      {userItem.phone || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      {userItem.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-xs font-medium">
                          <CheckCircle className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-xs font-medium">
                          <XCircle className="w-3.5 h-3.5" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleVerify(userItem._id, userItem.name)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                          userItem.isVerified
                            ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                            : 'border-emerald-600 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {userItem.isVerified ? 'Revoke Verification' : 'Verify User'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-slate-500 text-sm">
                    {loading ? 'Loading user database...' : 'No users found matching filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
