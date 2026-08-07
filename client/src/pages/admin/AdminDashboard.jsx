import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../services/adminApi';
import toast from 'react-hot-toast';
import { Users, Sprout, ShoppingBag, Stethoscope, Truck, ShieldAlert, RefreshCw, CheckCircle, XCircle, Search, ShieldCheck } from 'lucide-react';

export default function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (token) {
      fetchData();
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
