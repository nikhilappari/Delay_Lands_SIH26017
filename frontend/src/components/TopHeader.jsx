import React, { useState, useRef, useEffect } from 'react';
import { 
  PlusCircle, 
  Menu, 
  UserCheck, 
  Sparkles, 
  ShieldCheck, 
  LogOut, 
  User, 
  Users, 
  ChevronDown 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function TopHeader({ 
  activeTab, 
  setActiveTab, 
  apiOnline, 
  setIsMobileOpen,
  userRole = 'Collector',
  setUserRole 
}) {
  const { user, role, isAdmin, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoutClick = async () => {
    setDropdownOpen(false);
    await logout();
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-50 bg-[#191D23] border-b border-[#57707A]/40 pl-2 sm:pl-3 lg:pl-4 pr-4 sm:pr-6 lg:pr-8 flex items-center justify-between shadow-xs">
      {/* Left: Mobile Toggle & Brand Logo */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden p-1.5 rounded-lg text-[#979DAB] hover:text-white hover:bg-[#57707A]/30 border border-[#57707A]/50 transition-colors"
          title="Open Menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Delay Lands Logo */}
        <div 
          className="flex items-center cursor-pointer p-0 hover:opacity-90 transition-opacity"
          onClick={() => setActiveTab('dashboard')}
        >
          <img 
            src="/delay_lands_logo.png" 
            alt="Delay Lands" 
            className="h-9 sm:h-10 w-auto object-contain drop-shadow-xs select-none"
          />
        </div>

        {/* System Tag */}
        <div className="hidden lg:flex items-center space-x-2 pl-3 border-l border-[#57707A]/40">
          <span className="text-xs text-[#979DAB] font-medium">
            Predictive Intelligence Platform
          </span>
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-[#57707A]/30 text-[#DEDCDC] border border-[#57707A]/60">
            RF v1.2
          </span>
        </div>
      </div>

      {/* Right: User Profile Dropdown, ML Status & Action */}
      <div className="flex items-center space-x-2.5">
        
        {/* ML Status Indicator */}
        <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#191D23] border border-[#57707A]/60 text-[11px] text-[#DEDCDC] font-medium shadow-xs">
          <span className={`w-1.5 h-1.5 rounded-full ${apiOnline ? 'bg-emerald-400' : 'bg-rose-400'}`} />
          <span className="font-mono text-[11px]">
            {apiOnline ? 'Engine Online' : 'Offline'}
          </span>
        </div>

        {/* Action Button */}
        {activeTab !== 'predict' && (
          <button
            onClick={() => setActiveTab('predict')}
            className="hidden sm:inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#57707A] hover:bg-[#7E919F] text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Prediction</span>
          </button>
        )}

        {/* User Account & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 p-1.5 rounded-xl bg-[#191D23] hover:bg-[#57707A]/20 border border-[#57707A]/60 text-left transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-[#57707A] text-white flex items-center justify-center font-bold text-xs">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block text-left pr-1">
              <div className="text-[11.5px] font-semibold text-[#DEDCDC] leading-tight truncate max-w-[120px]">
                {user?.fullName || 'User'}
              </div>
              <div className="text-[10px] text-[#979DAB] flex items-center space-x-1">
                <span className={`font-bold ${role === 'ADMIN' ? 'text-purple-300' : 'text-blue-300'}`}>
                  {role || 'OFFICER'}
                </span>
                <span>•</span>
                <span className="truncate max-w-[70px] font-mono">{user?.employeeId}</span>
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-[#979DAB]" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-[#C5BAC4] shadow-lg py-1.5 z-50 text-xs text-[#191D23] animate-in fade-in zoom-in-95 duration-150">
              
              {/* User Header */}
              <div className="px-3.5 py-2 border-b border-[#C5BAC4]/50 bg-[#FAF9FB]">
                <div className="font-bold text-[#191D23] truncate">{user?.fullName}</div>
                <div className="text-[11px] text-[#7E919F] font-mono truncate">{user?.email}</div>
                <div className="text-[10px] text-[#57707A] mt-0.5 truncate">{user?.department}</div>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-3.5 py-2 hover:bg-[#DEDCDC]/40 text-left transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-[#57707A]" />
                  <span>My Profile & Security</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => {
                      setActiveTab('admin-users');
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-3.5 py-2 hover:bg-purple-50 text-purple-900 text-left transition-colors font-semibold"
                  >
                    <Users className="w-3.5 h-3.5 text-purple-700" />
                    <span>User Management (Admin)</span>
                  </button>
                )}
              </div>

              {/* Logout */}
              <div className="border-t border-[#C5BAC4]/50 pt-1">
                <button
                  onClick={handleLogoutClick}
                  className="w-full flex items-center space-x-2 px-3.5 py-2 hover:bg-rose-50 text-rose-700 text-left transition-colors font-medium"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span>Sign Out</span>
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </header>
  );
}

