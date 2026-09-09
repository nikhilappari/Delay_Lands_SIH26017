import React from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  BarChart3, 
  Cpu, 
  Layers, 
  ShieldCheck, 
  X, 
  MapPin, 
  Bell, 
  Globe2,
  Users,
  User,
  Shield,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab, apiOnline, isMobileOpen, setIsMobileOpen }) {
  const { user, role, isAdmin, logout } = useAuth();

  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      description: 'Portfolio overview & KPIs',
      icon: LayoutDashboard 
    },
    { 
      id: 'gis-map', 
      label: 'GIS Digital Map', 
      description: 'Spatial delay risk intelligence',
      icon: MapPin 
    },
    { 
      id: 'predict', 
      label: 'New Prediction', 
      description: 'Run case delay risk evaluation',
      icon: PlusCircle 
    },
    { 
      id: 'alerts', 
      label: 'Alerts & Escalations', 
      description: 'Early warning & SMS/Email hub',
      icon: Bell 
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
      description: 'State & district breakdown',
      icon: BarChart3 
    },
    { 
      id: 'integrations', 
      label: 'Govt Integrations', 
      description: 'PM GatiShakti & Bhoomi Sandbox',
      icon: Globe2 
    },
    { 
      id: 'model-info', 
      label: 'Model Governance', 
      description: 'Retraining & architecture',
      icon: Cpu 
    },
  ];

  const adminItems = [
    {
      id: 'admin-users',
      label: 'User Management',
      description: 'Approve & manage officers',
      icon: Users
    }
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
          className="fixed inset-0 bg-[#191D23]/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Left Navigation Panel (Clean & Resized Workspace Sidebar) */}
      <aside className={`
        fixed top-16 bottom-0 left-0 z-40
        w-56 bg-white border-r border-[#C5BAC4]/70
        flex flex-col justify-between
        transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Navigation Modules */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5">
          <div className="px-2.5 pb-2 pt-1 flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#7E919F] font-sans">
              Core Workspace
            </span>
            {/* Close button for mobile */}
            <button 
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1 rounded-md text-[#7E919F] hover:text-[#191D23] hover:bg-[#DEDCDC]/40"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150 ${
                  isActive
                    ? 'bg-[#191D23] text-white font-semibold shadow-xs'
                    : 'text-[#57707A] hover:text-[#191D23] hover:bg-[#DEDCDC]/45 font-medium'
                }`}
              >
                <Icon className={`w-[17px] h-[17px] flex-shrink-0 ${isActive ? 'text-[#DEDCDC]' : 'text-[#7E919F]'}`} />
                <span className="text-[13px] tracking-tight font-sans truncate">{item.label}</span>
              </button>
            );
          })}

          {/* Administrator Section (Visible ONLY for ADMIN) */}
          {isAdmin && (
            <div className="pt-3 mt-2 border-t border-[#C5BAC4]/50">
              <div className="px-2.5 pb-1.5 flex items-center space-x-1.5 text-[10.5px] font-bold uppercase tracking-wider text-purple-800 font-sans">
                <Shield className="w-3 h-3 text-purple-700" />
                <span>Administration</span>
              </div>
              {adminItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150 ${
                      isActive
                        ? 'bg-purple-900 text-white font-semibold shadow-xs'
                        : 'text-purple-900/80 hover:text-purple-950 hover:bg-purple-50 font-medium'
                    }`}
                  >
                    <Icon className={`w-[17px] h-[17px] flex-shrink-0 ${isActive ? 'text-purple-200' : 'text-purple-700'}`} />
                    <span className="text-[13px] tracking-tight font-sans truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* User Profile Navigation */}
          <div className="pt-3 mt-2 border-t border-[#C5BAC4]/50">
            <button
              onClick={() => handleNavClick('profile')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150 ${
                activeTab === 'profile'
                  ? 'bg-[#191D23] text-white font-semibold shadow-xs'
                  : 'text-[#57707A] hover:text-[#191D23] hover:bg-[#DEDCDC]/45 font-medium'
              }`}
            >
              <User className={`w-[17px] h-[17px] flex-shrink-0 ${activeTab === 'profile' ? 'text-[#DEDCDC]' : 'text-[#7E919F]'}`} />
              <span className="text-[13px] tracking-tight font-sans truncate">My Profile</span>
            </button>
          </div>
        </div>

        {/* Bottom Telemetry Info */}
        <div className="p-2.5 border-t border-[#C5BAC4]/50 space-y-2 bg-[#FAF8F5]/60">
          <div className="p-2.5 rounded-lg bg-white border border-[#C5BAC4]/60 space-y-1 shadow-2xs">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-[#191D23] truncate max-w-[120px]">{user?.fullName || 'User'}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {role}
              </span>
            </div>
            <div className="text-[10px] text-[#7E919F] font-mono truncate">{user?.department}</div>
          </div>

          <div className="flex items-center justify-between px-1 text-[10px] text-[#979DAB] font-mono">
            <span>GovPortal v1.2</span>
            <span>RBAC Active</span>
          </div>
        </div>
      </aside>
    </>
  );
}

