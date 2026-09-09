import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound, 
  Building2, 
  Sparkles,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ForgotPasswordModal from './ForgotPasswordModal';

export default function Login({ onNavigateToRegister }) {
  const { login, sessionExpiredMessage, setSessionExpiredMessage } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg('Please enter your official Email or Employee ID and password.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      await login({
        username: username.trim(),
        password,
        rememberMe
      });
    } catch (err) {
      const detail = err.response?.data?.detail || 'Authentication failed. Please check your credentials.';
      setErrorMsg(detail);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickFill = (role) => {
    if (role === 'admin') {
      setUsername('admin@delaylands.gov.in');
      setPassword('Admin@DelayLands2026');
      setErrorMsg(null);
    } else if (role === 'officer') {
      setUsername('officer@delaylands.gov.in');
      setPassword('Officer@DelayLands2026');
      setErrorMsg(null);
    }
  };

  return (
    <div className="min-h-screen app-bg flex flex-col justify-between font-sans antialiased text-[#191D23]">
      {/* Top Government Emblems Bar */}
      <header className="h-16 bg-[#191D23] border-b border-[#57707A]/40 px-4 sm:px-8 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <img 
            src="/delay_lands_logo.png" 
            alt="Delay Lands" 
            className="h-9 sm:h-10 w-auto object-contain drop-shadow-xs"
          />
          <div className="hidden sm:flex items-center space-x-2 pl-3 border-l border-[#57707A]/40">
            <span className="text-xs text-[#979DAB] font-medium">
              Predictive Intelligence Platform
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#57707A]/30 text-[#DEDCDC] border border-[#57707A]/60">
              GovPortal v1.2
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-[#DEDCDC]">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline font-medium">NIC / Ministry Compliant Portal</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-5 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Card */}
          <div className="clean-card p-6 sm:p-8 border border-[#C5BAC4]/80 shadow-md bg-white">
            
            {/* Header */}
            <div className="text-center space-y-1.5 mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#191D23] text-white shadow-xs mb-2">
                <ShieldCheck className="w-6 h-6 text-[#DEDCDC]" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#191D23]">
                Officer Portal Authentication
              </h1>
              <p className="text-xs sm:text-sm text-[#57707A]">
                Sign in with your official government credentials or service ID
              </p>
            </div>

            {/* Session Expired Notice */}
            {sessionExpiredMessage && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start space-x-2 mb-4">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">{sessionExpiredMessage}</div>
              </div>
            )}

            {/* Error Notice */}
            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2 mb-4">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{errorMsg}</div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Username Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#191D23] flex items-center justify-between">
                  <span>Official Email or Employee ID</span>
                  <span className="text-[10px] text-[#7E919F] font-normal">e.g. OFF-4091 or name@gov.in</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7E919F]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter official email or Employee ID"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[#C5BAC4] bg-white text-xs font-medium text-[#191D23] placeholder-[#979DAB] focus:outline-none focus:ring-2 focus:ring-[#57707A]/40 focus:border-[#57707A] transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#191D23]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[11px] text-[#57707A] hover:text-[#191D23] font-medium hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7E919F]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-[#C5BAC4] bg-white text-xs font-medium text-[#191D23] placeholder-[#979DAB] focus:outline-none focus:ring-2 focus:ring-[#57707A]/40 focus:border-[#57707A] transition-all font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#7E919F] hover:text-[#191D23]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 text-xs text-[#57707A] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-[#C5BAC4] text-[#191D23] focus:ring-[#57707A]"
                  />
                  <span>Remember my session on this device</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-lg bg-[#191D23] hover:bg-[#2B323B] text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Authenticate & Enter Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Bar for Easy Testing */}
            <div className="mt-6 pt-5 border-t border-[#C5BAC4]/50 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] text-[#7E919F]">
                <span className="font-semibold uppercase tracking-wider font-mono">Prototype Quick-Fill:</span>
                <span className="text-[10px] text-[#57707A]">1-Click Credentials</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin')}
                  className="p-2 rounded-lg bg-[#DEDCDC]/30 hover:bg-[#DEDCDC]/60 border border-[#C5BAC4]/70 text-left transition-colors"
                >
                  <div className="text-[11px] font-bold text-[#191D23]">Administrator</div>
                  <div className="text-[10px] text-[#7E919F] font-mono truncate">admin@delaylands.gov.in</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('officer')}
                  className="p-2 rounded-lg bg-[#DEDCDC]/30 hover:bg-[#DEDCDC]/60 border border-[#C5BAC4]/70 text-left transition-colors"
                >
                  <div className="text-[11px] font-bold text-[#191D23]">Government Officer</div>
                  <div className="text-[10px] text-[#7E919F] font-mono truncate">officer@delaylands.gov.in</div>
                </button>
              </div>
            </div>

            {/* Registration Link */}
            <div className="mt-5 text-center text-xs text-[#57707A]">
              New official?{' '}
              <button
                onClick={onNavigateToRegister}
                className="font-bold text-[#191D23] hover:underline"
              >
                Register Officer Account
              </button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="text-center text-[11px] text-[#7E919F] space-y-1">
            <p>Authorized Government Personnel Only. All access attempts are audited and logged.</p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="h-12 bg-white border-t border-[#C5BAC4]/70 px-4 sm:px-8 flex items-center justify-between text-xs text-[#7E919F]">
        <div>© 2026 Delay Lands | National Infrastructure Intelligence</div>
        <div className="hidden sm:block">Role-Based Access Control (RBAC) Enforced</div>
      </footer>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <ForgotPasswordModal onClose={() => setShowForgotModal(false)} />
      )}
    </div>
  );
}
