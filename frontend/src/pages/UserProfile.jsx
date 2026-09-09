import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Building2, 
  Briefcase, 
  ShieldCheck, 
  KeyRound, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Save,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UserProfile() {
  const { user, updateProfile, changePassword } = useAuth();

  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    department: user?.department || '',
    designation: user?.designation || ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);
  const [profileError, setProfileError] = useState(null);

  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileError(null);
    try {
      setProfileSaving(true);
      await updateProfile(profileForm);
      setProfileMsg('Profile information updated successfully.');
    } catch (err) {
      setProfileError(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);
    setPasswordError(null);

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordError('New Password and Confirm New Password do not match.');
      return;
    }

    try {
      setPasswordSaving(true);
      const res = await changePassword(passwordForm);
      setPasswordMsg(res.message || 'Password changed successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      setPasswordError(err.response?.data?.detail || 'Failed to update password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="pb-1">
        <h1 className="text-2xl font-bold tracking-tight text-[#191D23]">
          Officer Profile & Security Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#57707A] mt-0.5">
          Manage your departmental information, credentials, and access credentials.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="clean-card p-5 sm:p-6 border border-[#C5BAC4]/80 shadow-xs bg-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#C5BAC4]/50">
          <div className="flex items-center space-x-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#191D23] text-white flex items-center justify-center font-bold text-xl shadow-xs">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-[#191D23]">{user?.fullName}</h2>
                <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold tracking-wider ${
                  user?.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}>
                  {user?.role}
                </span>
                <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {user?.status}
                </span>
              </div>
              <p className="text-xs text-[#57707A] mt-0.5 font-mono">
                Employee ID: <span className="font-semibold text-[#191D23]">{user?.employeeId}</span> • {user?.email}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs text-[#7E919F]">
            <div>Account Created: <strong>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</strong></div>
            <div>Last Login: <strong>{user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Active Session'}</strong></div>
          </div>
        </div>

        {/* Two Columns: Edit Profile & Change Password */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
          
          {/* Form 1: Edit Contact Info */}
          <form onSubmit={handleProfileSubmit} className="space-y-3.5">
            <div className="flex items-center space-x-1.5 pb-1 border-b border-[#C5BAC4]/40">
              <User className="w-4 h-4 text-[#57707A]" />
              <h3 className="text-xs font-bold text-[#191D23] uppercase tracking-wider">Official Details</h3>
            </div>

            {profileMsg && (
              <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{profileMsg}</span>
              </div>
            )}

            {profileError && (
              <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>{profileError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#191D23]">Full Name</label>
              <input
                type="text"
                value={profileForm.fullName}
                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#C5BAC4] text-xs text-[#191D23] focus:outline-none focus:ring-2 focus:ring-[#57707A]/40"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#191D23]">Department</label>
              <input
                type="text"
                value={profileForm.department}
                onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#C5BAC4] text-xs text-[#191D23] focus:outline-none focus:ring-2 focus:ring-[#57707A]/40"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#191D23]">Designation</label>
              <input
                type="text"
                value={profileForm.designation}
                onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#C5BAC4] text-xs text-[#191D23] focus:outline-none focus:ring-2 focus:ring-[#57707A]/40"
                required
              />
            </div>

            <button
              type="submit"
              disabled={profileSaving}
              className="btn-primary text-xs flex items-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{profileSaving ? 'Saving...' : 'Update Details'}</span>
            </button>
          </form>

          {/* Form 2: Change Password */}
          <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
            <div className="flex items-center space-x-1.5 pb-1 border-b border-[#C5BAC4]/40">
              <Lock className="w-4 h-4 text-[#57707A]" />
              <h3 className="text-xs font-bold text-[#191D23] uppercase tracking-wider">Change Password</h3>
            </div>

            {passwordMsg && (
              <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{passwordMsg}</span>
              </div>
            )}

            {passwordError && (
              <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>{passwordError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#191D23]">Current Password</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-lg border border-[#C5BAC4] text-xs font-mono text-[#191D23] focus:outline-none focus:ring-2 focus:ring-[#57707A]/40"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#191D23]">New Password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Min 8 chars with symbols"
                className="w-full px-3 py-2 rounded-lg border border-[#C5BAC4] text-xs font-mono text-[#191D23] focus:outline-none focus:ring-2 focus:ring-[#57707A]/40"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#191D23]">Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.confirmNewPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-lg border border-[#C5BAC4] text-xs font-mono text-[#191D23] focus:outline-none focus:ring-2 focus:ring-[#57707A]/40"
                required
              />
            </div>

            <button
              type="submit"
              disabled={passwordSaving}
              className="btn-secondary text-xs flex items-center space-x-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{passwordSaving ? 'Updating...' : 'Change Password'}</span>
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
