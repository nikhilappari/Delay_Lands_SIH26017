import React, { useState } from 'react';
import { 
  ShieldCheck, 
  User, 
  Mail, 
  Building2, 
  Briefcase, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register({ onNavigateToLogin }) {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    employeeId: '',
    email: '',
    department: 'National Highways Authority of India (NHAI)',
    designation: 'Special Land Acquisition Officer (SLAO)',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successData, setSuccessData] = useState(null);

  const departments = [
    'National Highways Authority of India (NHAI)',
    'Ministry of Railways / Dedicated Freight Corridor (DFCCIL)',
    'State Revenue & Land Reforms Department',
    'Ministry of Road Transport & Highways (MoRTH)',
    'State Industrial Development Corporation',
    'State Irrigation & Water Resources Department',
    'Airport Authority of India (AAI)',
    'District Land Acquisition Collectorate'
  ];

  const designations = [
    'Special Land Acquisition Officer (SLAO)',
    'District Collector / Magistrate (DM)',
    'Sub-Divisional Magistrate (SDM)',
    'Competent Authority for Land Acquisition (CALA)',
    'Project Director (PD)',
    'Revenue Circle Inspector / Tehsildar',
    'Chief General Manager (Technical / Land)'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getPasswordStrength = () => {
    const p = formData.password;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score += 25;
    if (/[A-Z]/.test(p)) score += 25;
    if (/[0-9]/.test(p)) score += 25;
    if (/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(p)) score += 25;
    return score;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Password and Confirm Password do not match.');
      return;
    }

    if (getPasswordStrength() < 75) {
      setErrorMsg('Password must be at least 8 chars long with uppercase, digits, and special characters.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await register(formData);
      setSuccessData(res);
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to create officer account. Please check inputs.';
      setErrorMsg(typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen app-bg flex flex-col justify-between font-sans antialiased text-[#191D23]">
      {/* Top Header */}
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
              Officer Onboarding
            </span>
          </div>
        </div>

        <button
          onClick={onNavigateToLogin}
          className="btn-secondary text-xs text-[#DEDCDC] border-[#57707A]/60 bg-[#191D23]"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          <span>Back to Sign In</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-xl space-y-5 animate-in fade-in duration-200">
          
          <div className="clean-card p-6 sm:p-8 border border-[#C5BAC4]/80 shadow-md bg-white">
            
            {successData ? (
              /* Success Confirmation Screen */
              <div className="text-center space-y-4 py-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-xl font-bold text-[#191D23]">Registration Request Submitted</h2>
                  <p className="text-xs text-[#57707A] max-w-md mx-auto">
                    Your Government Officer account (<strong className="font-mono">{formData.email}</strong> / <strong className="font-mono">{formData.employeeId}</strong>) has been registered in <strong>PENDING</strong> status.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#DEDCDC]/20 border border-[#C5BAC4]/70 text-left text-xs space-y-2 max-w-md mx-auto">
                  <div className="flex items-center space-x-2 text-[#191D23] font-semibold">
                    <Info className="w-4 h-4 text-[#57707A]" />
                    <span>Administrator Verification Workflow</span>
                  </div>
                  <p className="text-[#57707A]">
                    As per security protocol, newly registered Government Officer accounts require approval from a platform Administrator before login is enabled.
                  </p>
                  <p className="text-[11px] text-[#7E919F]">
                    Once activated by your department administrator, you can log in immediately.
                  </p>
                </div>

                <div className="pt-3">
                  <button
                    onClick={onNavigateToLogin}
                    className="btn-primary text-xs w-full max-w-xs mx-auto py-2.5"
                  >
                    <span>Proceed to Sign In</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            ) : (
              /* Registration Form */
              <>
                <div className="space-y-1.5 mb-6 text-center sm:text-left">
                  <div className="inline-flex items-center space-x-2 text-xs font-semibold text-[#57707A] bg-[#DEDCDC]/30 px-2.5 py-1 rounded-md mb-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Official Officer Registration</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#191D23]">
                    Create Officer Account
                  </h1>
                  <p className="text-xs text-[#57707A]">
                    Register for access to land acquisition predictive analytics, GIS spatial maps, and early warning tools.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2 mb-4">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1 font-medium">{errorMsg}</div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {/* Row 1: Full Name & Employee ID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#191D23]">Full Name *</label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="e.g. Dr. Ramesh Kulkarni"
                        className="w-full px-3 py-2 rounded-lg border border-[#C5BAC4] text-xs font-medium text-[#191D23] focus:outline-none focus:ring-2 focus:ring-[#57707A]/40"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#191D23]">Employee / Service ID *</label>
                      <input
                        type="text"
                        name="employeeId"
                        value={formData.employeeId}
                        onChange={handleChange}
                        placeholder="e.g. OFF-5921 or NHAI-991"
                        className="w-full px-3 py-2 rounded-lg border border-[#C5BAC4] text-xs font-medium font-mono text-[#191D23] focus:outline-none focus:ring-2 focus:ring-[#57707A]/40"
                        required
                      />
                    </div>
                  </div>

                  {/* Row 2: Official Email */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#191D23] flex items-center justify-between">
                      <span>Official Email Address *</span>
                      <span className="text-[10px] text-[#7E919F]">Official government or departmental email</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g. ramesh.kulkarni@nhai.org or officer@delaylands.gov.in"
                      className="w-full px-3 py-2 rounded-lg border border-[#C5BAC4] text-xs font-medium text-[#191D23] focus:outline-none focus:ring-2 focus:ring-[#57707A]/40"
                      required
                    />
                  </div>

                  {/* Row 3: Department & Designation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#191D23]">Department / Ministry *</label>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        className="w-full px-3 py-2 rounded-lg border border-[#C5BAC4] text-xs font-medium text-[#191D23] focus:outline-none focus:ring-2 focus:ring-[#57707A]/40"
                        required
                      >
                        {departments.map((dept, idx) => (
                          <option key={idx} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#191D23]">Designation / Rank *</label>
                      <select
                        name="designation"
                        value={formData.designation}
                        onChange={handleChange}
                        className="w-full px-3 py-2 rounded-lg border border-[#C5BAC4] text-xs font-medium text-[#191D23] focus:outline-none focus:ring-2 focus:ring-[#57707A]/40"
                        required
                      >
                        {designations.map((desig, idx) => (
                          <option key={idx} value={desig}>{desig}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 4: Password & Confirm Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#191D23]">Password *</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••••••"
                        className="w-full px-3 py-2 rounded-lg border border-[#C5BAC4] text-xs font-medium font-mono text-[#191D23] focus:outline-none focus:ring-2 focus:ring-[#57707A]/40"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#191D23]">Confirm Password *</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••••••••••"
                        className="w-full px-3 py-2 rounded-lg border border-[#C5BAC4] text-xs font-medium font-mono text-[#191D23] focus:outline-none focus:ring-2 focus:ring-[#57707A]/40"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Strength Meter */}
                  {formData.password && (
                    <div className="space-y-1 pt-0.5">
                      <div className="flex items-center justify-between text-[10.5px] text-[#7E919F]">
                        <span>Password Strength:</span>
                        <span className="font-semibold">
                          {getPasswordStrength() === 100 ? 'Strong' : getPasswordStrength() >= 50 ? 'Medium' : 'Weak'}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#DEDCDC] overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            getPasswordStrength() === 100 ? 'bg-emerald-600' :
                            getPasswordStrength() >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${getPasswordStrength()}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Role Notification Banner */}
                  <div className="p-3 rounded-lg bg-[#FAF9FB] border border-[#C5BAC4]/70 text-[11px] text-[#57707A] flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-[#57707A] shrink-0" />
                    <span>Assigned Role: <strong>Government Officer</strong> (Account status will be set to <strong>PENDING</strong> verification)</span>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 px-4 rounded-lg bg-[#191D23] hover:bg-[#2B323B] text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-colors shadow-xs disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Submit Registration for Approval</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-5 text-center text-xs text-[#57707A]">
                  Already have an approved account?{' '}
                  <button
                    onClick={onNavigateToLogin}
                    className="font-bold text-[#191D23] hover:underline"
                  >
                    Sign In
                  </button>
                </div>
              </>
            )}

          </div>

        </div>
      </main>

      <footer className="h-12 bg-white border-t border-[#C5BAC4]/70 px-4 sm:px-8 flex items-center justify-between text-xs text-[#7E919F]">
        <div>© 2026 Delay Lands | National Infrastructure Intelligence</div>
        <div className="hidden sm:block">Ministry of Land Resources Verification Node</div>
      </footer>
    </div>
  );
}
