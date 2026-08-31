import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { User, Phone, MapPin, ShieldCheck, Key, Save, Sprout, ShoppingBag, Stethoscope, Truck, ShieldAlert } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateProfile, changePassword, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('details');

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    district: user?.address?.district || '',
    postalCode: user?.address?.postalCode || '',
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handlePasswordChangeInput = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      await updateProfile({
        name: profileForm.name,
        phone: profileForm.phone,
        bio: profileForm.bio,
        address: {
          street: profileForm.street,
          city: profileForm.city,
          district: profileForm.district,
          postalCode: profileForm.postalCode,
        },
      });
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmNewPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }

    setIsChangingPw(true);
    try {
      await changePassword(passwords.currentPassword, passwords.newPassword);
      toast.success('Password updated successfully!');
      setPasswords({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (error) {
      toast.error(error.message || 'Failed to change password.');
    } finally {
      setIsChangingPw(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'farmer': return <Sprout className="w-5 h-5 text-emerald-600" />;
      case 'buyer': return <ShoppingBag className="w-5 h-5 text-blue-600" />;
      case 'expert': return <Stethoscope className="w-5 h-5 text-purple-600" />;
      case 'rider': return <Truck className="w-5 h-5 text-amber-600" />;
      case 'admin': return <ShieldAlert className="w-5 h-5 text-rose-600" />;
      default: return <User className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-200/50 mb-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 flex items-center justify-center text-white text-3xl font-extrabold shadow-inner">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold">{user?.name}</h1>
              {user?.isVerified && (
                <span className="bg-emerald-400/30 border border-emerald-300 text-emerald-100 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified
                </span>
              )}
            </div>
            <p className="text-emerald-100 text-sm mb-3">{user?.email}</p>

            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 text-xs font-semibold uppercase tracking-wider">
              {getRoleIcon(user?.role)}
              <span>{user?.role} Profile</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 gap-4">
        <button
          onClick={() => setActiveTab('details')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'details'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <User className="w-4 h-4" /> Account Details
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'password'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Key className="w-4 h-4" /> Security & Password
        </button>
      </div>

      {/* Tab Content: Details */}
      {activeTab === 'details' && (
        <form onSubmit={handleSaveProfile} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-600" /> Personal Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={profileForm.name}
                onChange={handleProfileChange}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Phone Number</label>
              <input
                type="text"
                name="phone"
                value={profileForm.phone}
                onChange={handleProfileChange}
                placeholder="+8801700000000"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Bio / Business Overview</label>
            <textarea
              name="bio"
              rows="3"
              value={profileForm.bio}
              onChange={handleProfileChange}
              placeholder="Tell us about your farm, store, or expert specialization..."
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <hr className="border-slate-100" />

          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" /> Address Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Street Address</label>
              <input
                type="text"
                name="street"
                value={profileForm.street}
                onChange={handleProfileChange}
                placeholder="123 Agro Village"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">City / Upazila</label>
              <input
                type="text"
                name="city"
                value={profileForm.city}
                onChange={handleProfileChange}
                placeholder="Sadar"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">District</label>
              <input
                type="text"
                name="district"
                value={profileForm.district}
                onChange={handleProfileChange}
                placeholder="Dinajpur"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Postal Code</label>
              <input
                type="text"
                name="postalCode"
                value={profileForm.postalCode}
                onChange={handleProfileChange}
                placeholder="5200"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md shadow-emerald-200 transition flex items-center gap-2 text-sm disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {isUpdatingProfile ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Tab Content: Password */}
      {activeTab === 'password' && (
        <form onSubmit={handleChangePasswordSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm max-w-lg space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-emerald-600" /> Change Security Password
          </h2>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Current Password</label>
            <input
              type="password"
              name="currentPassword"
              required
              value={passwords.currentPassword}
              onChange={handlePasswordChangeInput}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">New Password</label>
            <input
              type="password"
              name="newPassword"
              required
              value={passwords.newPassword}
              onChange={handlePasswordChangeInput}
              placeholder="Min 6 characters"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Confirm New Password</label>
            <input
              type="password"
              name="confirmNewPassword"
              required
              value={passwords.confirmNewPassword}
              onChange={handlePasswordChangeInput}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isChangingPw}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md shadow-emerald-200 transition text-sm disabled:opacity-60"
            >
              {isChangingPw ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
