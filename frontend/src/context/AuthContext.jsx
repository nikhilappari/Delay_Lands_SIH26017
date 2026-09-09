import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import api, { apiLogin, apiRegister, apiGetMe, apiLogout, apiUpdateProfile, apiChangePassword } from '../services/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'delaylands_auth_token';
const USER_KEY = 'delaylands_auth_user';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
  });

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState(null);

  // Set up Axios interceptors for automatic Bearer token and 401 handling
  useEffect(() => {
    // Request Interceptor
    const reqInterceptor = api.interceptors.request.use(
      (config) => {
        const activeToken = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
        if (activeToken) {
          config.headers.Authorization = `Bearer ${activeToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response Interceptor for Session Expiration
    const resInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          // If we had a token and got 401, session expired
          const hadToken = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
          if (hadToken) {
            handleLogout(false);
            setSessionExpiredMessage("Your session has expired. Please log in again.");
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(reqInterceptor);
      api.interceptors.response.eject(resInterceptor);
    };
  }, []);

  // Validate session on mount
  useEffect(() => {
    const verifySession = async () => {
      const savedToken = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
      if (savedToken) {
        try {
          const userData = await apiGetMe();
          setUser(userData);
          const storage = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
          storage.setItem(USER_KEY, JSON.stringify(userData));
        } catch (err) {
          console.warn("Session verification failed:", err);
          handleLogout(false);
        }
      }
      setLoading(false);
    };

    verifySession();
  }, []);

  const handleLogin = async (credentials) => {
    setSessionExpiredMessage(null);
    const data = await apiLogin(credentials);
    const { access_token, user: loggedUser } = data;

    const storage = credentials.rememberMe ? localStorage : sessionStorage;
    // Clear other storage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);

    storage.setItem(TOKEN_KEY, access_token);
    storage.setItem(USER_KEY, JSON.stringify(loggedUser));

    setToken(access_token);
    setUser(loggedUser);
    return loggedUser;
  };

  const handleRegister = async (userData) => {
    return await apiRegister(userData);
  };

  const handleLogout = async (callApi = true) => {
    if (callApi && token) {
      try {
        await apiLogout();
      } catch (e) {
        // Ignore logout network errors
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  const handleUpdateProfile = async (profileData) => {
    const updated = await apiUpdateProfile(profileData);
    setUser(updated);
    const storage = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
    storage.setItem(USER_KEY, JSON.stringify(updated));
    return updated;
  };

  const handleChangePassword = async (pwdData) => {
    return await apiChangePassword(pwdData);
  };

  const value = useMemo(() => ({
    user,
    token,
    role: user?.role || null,
    status: user?.status || null,
    isAdmin: user?.role === 'ADMIN',
    isOfficer: user?.role === 'OFFICER',
    isAuthenticated: !!token && !!user && user.status === 'ACTIVE',
    loading,
    sessionExpiredMessage,
    setSessionExpiredMessage,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    updateProfile: handleUpdateProfile,
    changePassword: handleChangePassword,
    refreshUser: async () => {
      try {
        const u = await apiGetMe();
        setUser(u);
      } catch {}
    }
  }), [user, token, loading, sessionExpiredMessage]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
