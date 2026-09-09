import React from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  BarChart3, 
  Cpu, 
  Layers, 
  ShieldCheck, 
  X
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, apiOnline, isMobileOpen, setIsMobileOpen }) {
  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      description: 'Portfolio overview & KPIs',
      icon: LayoutDashboard 
    },
    { 
      id: 'predict', 
      label: 'New Prediction', 
      description: 'Run case delay risk evaluation',
      icon: PlusCircle 
    },
    { 
      id: 'history', 
      label: 'Prediction History', 
      description: 'Audit log & case records',
      icon: History 
    },
    { 
      id: 'analytics', 
      label: 'Delay Analytics', 
      description: 'Sectoral & stage breakdown',
      icon: BarChart3 
    },
    { 
      id: 'model-info', 
      label: 'Model Governance', 
      description: 'Architecture & calibrations',
      icon: Cpu 
    },
  ];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Left Sidebar Panel */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50
        w-72 bg-white border-r border-slate-200/90
        flex flex-col justify-between
        transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Top Branding Section */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => handleNavClick('dashboard')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 via-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-base font-extrabold tracking-tight text-slate-900">
                  LandAcq<span className="text-brand-600">.ai</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-brand-700 border border-blue-200">
                  ML
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Delay Early Warning
              </p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action Button */}
        <div className="px-4 pt-4 pb-2">
          <button
            onClick={() => handleNavClick('predict')}
            className={`w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold shadow-sm transition-all duration-200 ${
              activeTab === 'predict'
                ? 'bg-brand-700 text-white shadow-brand-500/25 ring-2 ring-brand-500/30'
                : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/20 hover:shadow-md'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Evaluate New Case</span>
          </button>
        </div>

        {/* Navigation Modules */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <div className="px-3 pb-2 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Navigation Modules
            </span>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-start space-x-3 px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 group ${
                  isActive
                    ? 'bg-brand-50/80 text-brand-700 border border-brand-200/70 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className={`mt-0.5 p-1.5 rounded-lg transition-colors ${
                  isActive ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold leading-tight">
                    {item.label}
                  </div>
                  <div className={`text-[11px] leading-tight truncate mt-0.5 ${
                    isActive ? 'text-brand-600/80' : 'text-slate-400 group-hover:text-slate-500'
                  }`}>
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom System Telemetry Card */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[11px] font-bold text-slate-700">Random Forest</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-emerald-100/80 text-emerald-800 border border-emerald-200">
                83.0% Acc
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
              <span>ML Service:</span>
              <div className="flex items-center space-x-1.5">
                <span className={`w-2 h-2 rounded-full ${apiOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <span className={`font-semibold font-mono text-[10px] ${apiOnline ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {apiOnline ? 'Online (8000)' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-1 text-[10px] text-slate-400 font-mono">
            <span>v1.0 • Enterprise Edition</span>
            <span>SQLite v3</span>
          </div>
        </div>
      </aside>
    </>
  );
}

