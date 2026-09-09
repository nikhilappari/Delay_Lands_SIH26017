import React, { useState } from 'react';
import { X, KeyRound, Mail, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { apiForgotPassword, apiResetPassword } from '../services/api';

export default function ForgotPasswordModal({ onClose }) {
  const [step, setStep] = useState(1); // 1: Request Token, 2: Reset Password
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleRequestToken = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await apiForgotPassword(email.trim());
      if (res.resetToken) {
        setResetToken(res.resetToken); // Automatically populate for quick prototype test
      }
      setStep(2);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to request reset token.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('New Password and Confirm New Password do not match.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await apiResetPassword({
        token: resetToken.trim(),
        newPassword,
        confirmNewPassword
      });
      setSuccessMsg(res.message || 'Password reset successfully!');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to reset password. Please check your token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#191D23]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full border border-[#C5BAC4] shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#191D23] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <KeyRound className="w-5 h-5 text-[#DEDCDC]" />
            <h3 className="font-bold text-sm">Official Account Password Recovery</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#979DAB] hover:text-white hover:bg-[#57707A]/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">{successMsg}</div>
            </div>
          )}

          {step === 1 && !successMsg && (
            <form onSubmit={handleRequestToken} className="space-y-4">
              <p className="text-xs text-[#57707A]">
                Enter your registered official email address. A secure authorization reset token will be generated.
              </p>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#191D23]">Official Email ID</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7E919F]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@delaylands.gov.in"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#C5BAC4] text-xs font-medium text-[#191D23] focus:outline-none focus:ring-2 focus:ring-[#57707A]/40"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button type="button" onClick={onClose} className="btn-secondary text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary text-xs">
                  {loading ? 'Generating...' : 'Generate Reset Token'}
                </button>
              </div>
            </form>
          )}

          {step === 2 && !successMsg && (
            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <p className="text-xs text-[#57707A]">
                Enter the authorization token and set your new account password.
              </p>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#191D23]">Authorization Token *</label>
                <input
                  type="text"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Paste reset token here"
                  className="w-full px-3 py-2 rounded-lg border border-[#C5BAC4] text-xs font-mono text-[#191D23] focus:outline-none focus:ring-2 focus:ring-[#57707A]/40"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#191D23]">New Password *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 rounded-lg border border-[#C5BAC4] text-xs font-mono text-[#191D23] focus:outline-none focus:ring-2 focus:ring-[#57707A]/40"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#191D23]">Confirm New Password *</label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 rounded-lg border border-[#C5BAC4] text-xs font-mono text-[#191D23] focus:outline-none focus:ring-2 focus:ring-[#57707A]/40"
                  required
                />
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button type="button" onClick={() => setStep(1)} className="text-xs text-[#57707A] hover:underline">
                  Back
                </button>
                <div className="flex space-x-2">
                  <button type="button" onClick={onClose} className="btn-secondary text-xs">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="btn-primary text-xs">
                    {loading ? 'Updating...' : 'Set New Password'}
                  </button>
                </div>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
