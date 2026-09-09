import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import Dashboard from './pages/Dashboard';
import GisMap from './pages/GisMap';
import AlertsHub from './pages/AlertsHub';
import Integrations from './pages/Integrations';
import NewPrediction from './pages/NewPrediction';
import PredictionResult from './pages/PredictionResult';
import PredictionHistory from './pages/PredictionHistory';
import Analytics from './pages/Analytics';
import ModelInfo from './pages/ModelInfo';
import UserProfile from './pages/UserProfile';
import AdminUserManagement from './pages/AdminUserManagement';
import Login from './pages/Login';
import Register from './pages/Register';
import PredictionDetailModal from './components/PredictionDetailModal';
import { checkHealth } from './services/api';
import { AuthProvider, useAuth } from './context/AuthContext';

function MainApp() {
  const { isAuthenticated, loading, role, isAdmin } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentPrediction, setCurrentPrediction] = useState(null);
  const [modalItem, setModalItem] = useState(null);
  const [apiOnline, setApiOnline] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const pingApi = async () => {
      try {
        await checkHealth();
        setApiOnline(true);
      } catch (err) {
        setApiOnline(false);
      }
    };

    pingApi();
    const interval = setInterval(pingApi, 10000);
    return () => clearInterval(interval);
  }, []);

  // Guard admin routes against non-admin users
  useEffect(() => {
    if (activeTab === 'admin-users' && !isAdmin) {
      setActiveTab('dashboard');
    }
  }, [activeTab, isAdmin]);

  const handlePredictionSuccess = (predictionResult) => {
    setCurrentPrediction(predictionResult);
    setActiveTab('result');
  };

  const handleResetPrediction = () => {
    setCurrentPrediction(null);
    setActiveTab('predict');
  };

  const handleViewHistory = () => {
    setActiveTab('history');
  };

  const tabMeta = {
    'dashboard': { label: 'Portfolio Overview', desc: 'Real-time land acquisition risk analytics & KPI telemetry' },
    'gis-map': { label: 'GIS Spatial Map', desc: 'Interactive corridor mapping & state delay hotspots' },
    'alerts': { label: 'Alerts & Escalations', desc: 'Automated deadline breach detection & multi-channel dispatch' },
    'predict': { label: 'New Prediction', desc: 'ML inference engine for project delay vulnerability' },
    'result': { label: 'Prediction Assessment', desc: 'Factor breakdown, delay projection & mitigation roadmap' },
    'history': { label: 'Prediction History', desc: 'Governance audit log & historical case database' },
    'analytics': { label: 'Delay Analytics', desc: 'State-level risk distributions & statutory stage bottlenecks' },
    'integrations': { label: 'Govt Integrations', desc: 'PM GatiShakti NMP & Bhoomi land registry connectors' },
    'model-info': { label: 'Model Governance', desc: 'Random Forest specs, continuous retraining & threshold calibration' },
    'profile': { label: 'Officer Profile', desc: 'Manage credentials and official department information' },
    'admin-users': { label: 'Admin User Management', desc: 'Approve pending officers, manage roles, and review security logs' },
  };

  // Loading Splash Screen
  if (loading) {
    return (
      <div className="min-h-screen app-bg flex flex-col items-center justify-center space-y-4">
        <img 
          src="/delay_lands_logo.png" 
          alt="Delay Lands" 
          className="h-12 w-auto object-contain animate-pulse"
        />
        <div className="flex items-center space-x-2 text-xs text-[#57707A] font-medium">
          <div className="w-3.5 h-3.5 border-2 border-[#57707A] border-t-transparent rounded-full animate-spin" />
          <span>Authenticating security session...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated Flow
  if (!isAuthenticated) {
    if (authView === 'register') {
      return <Register onNavigateToLogin={() => setAuthView('login')} />;
    }
    return <Login onNavigateToRegister={() => setAuthView('register')} />;
  }

  // Authenticated Full Workspace
  return (
    <div className="min-h-screen app-bg text-[#191D23] flex flex-col font-sans antialiased">
      {/* 1. Global Full-Width Top Bar with Delay Lands Logo, Avatar & Dropdown */}
      <TopHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        apiOnline={apiOnline}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* 2. Body Shell: Left Navigation Bar + Main Workspace */}
      <div className="flex-1 flex min-h-screen pt-16">
        {/* Left Navigation Bar (Below Top Bar) */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          apiOnline={apiOnline} 
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />

        {/* Main Content Workspace */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-56 transition-all duration-300">
          <div className="flex-1 w-full max-w-6xl mx-auto px-3.5 sm:px-6 py-5">
            {/* Workspace Status & Breadcrumb Header */}
            <div className="flex items-center justify-between px-3.5 py-2 mb-3.5 text-xs bg-white/75 backdrop-blur-md rounded-xl border border-[#C5BAC4]/70 shadow-2xs">
              <div className="flex items-center space-x-2">
                <span className="text-[#7E919F] font-bold text-[10.5px] uppercase tracking-wider font-sans">Workspace</span>
                <span className="text-[#C5BAC4] text-xs">/</span>
                <span className="font-bold text-[#191D23] tracking-tight text-[13px] font-sans">{tabMeta[activeTab]?.label || 'Overview'}</span>
              </div>
              <div className="hidden sm:flex items-center space-x-2.5 text-[11.5px] text-[#57707A]">
                <span className="flex items-center space-x-1.5 font-sans">
                  <span className={`w-2 h-2 rounded-full ${apiOnline ? 'bg-emerald-600 animate-pulse' : 'bg-rose-500'}`} />
                  <span className="font-medium text-[#57707A]">{apiOnline ? 'Engine Online' : 'Engine Offline'}</span>
                </span>
                <span className="text-[#C5BAC4]">•</span>
                <span className={`font-mono px-2 py-0.5 rounded-md border text-[10.5px] font-bold ${
                  role === 'ADMIN' ? 'bg-purple-100 text-purple-900 border-purple-200' : 'bg-blue-50 text-blue-900 border-blue-200'
                }`}>
                  Role: {role || 'OFFICER'}
                </span>
              </div>
            </div>

            {/* Dynamic Page Views inside sleek glassmorphic container */}
            <main className="workspace-container p-4 sm:p-6 lg:p-7 shadow-md">
              {activeTab === 'dashboard' && (
                <Dashboard 
                  setActiveTab={setActiveTab} 
                  setSelectedPrediction={setCurrentPrediction} 
                />
              )}

              {activeTab === 'gis-map' && (
                <GisMap 
                  onSelectProject={(project) => setModalItem(project)}
                  setActiveTab={setActiveTab}
                />
              )}

              {activeTab === 'alerts' && (
                <AlertsHub 
                  onSelectProject={(project) => setModalItem(project)}
                  userRole={role}
                />
              )}

              {activeTab === 'predict' && (
                <NewPrediction 
                  onPredictionSuccess={handlePredictionSuccess} 
                />
              )}

              {activeTab === 'result' && (
                <PredictionResult 
                  result={currentPrediction} 
                  onReset={handleResetPrediction}
                  onViewHistory={handleViewHistory}
                />
              )}

              {activeTab === 'history' && (
                <PredictionHistory 
                  setActiveTab={setActiveTab} 
                />
              )}

              {activeTab === 'analytics' && (
                <Analytics 
                  setActiveTab={setActiveTab} 
                />
              )}

              {activeTab === 'integrations' && (
                <Integrations />
              )}

              {activeTab === 'model-info' && (
                <ModelInfo />
              )}

              {activeTab === 'profile' && (
                <UserProfile />
              )}

              {activeTab === 'admin-users' && isAdmin && (
                <AdminUserManagement />
              )}
            </main>
          </div>

          {/* Detail Modal */}
          {modalItem && (
            <PredictionDetailModal
              prediction={modalItem}
              onClose={() => setModalItem(null)}
            />
          )}

          {/* Enterprise Footer */}
          <footer className="w-full border-t border-[#C5BAC4] bg-white/80 backdrop-blur-xs py-3.5 shadow-xs mt-auto">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#57707A]">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-[#191D23]">Land Acquisition Delay Predictive System</span>
                <span>•</span>
                <span>Random Forest Classifier (200 Trees)</span>
              </div>

              <div className="flex items-center space-x-3 text-[11px]">
                <span>
                  Backend API:{' '}
                  <strong className={apiOnline ? 'text-[#57707A] font-bold' : 'text-rose-600 font-bold'}>
                    {apiOnline ? 'Operational (8000)' : 'Offline'}
                  </strong>
                </span>
                <span>•</span>
                <span>Role-Based Access Control (RBAC)</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
