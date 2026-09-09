import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://127.0.0.1:8000/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export const predictDelay = async (caseData) => {
  const response = await api.post('/predict', caseData);
  return response.data;
};

export const getPredictionHistory = async (params = {}) => {
  const response = await api.get('/predictions', { params });
  return response.data;
};

export const getPredictionDetail = async (id) => {
  const response = await api.get(`/predictions/${id}`);
  return response.data;
};

export const deletePrediction = async (id) => {
  const response = await api.delete(`/predictions/${id}`);
  return response.data;
};

export const getAnalytics = async () => {
  const response = await api.get('/analytics');
  return response.data;
};

export const getModelInfo = async () => {
  const response = await api.get('/model-info');
  return response.data;
};

export const seedDataset = async (count = 50) => {
  const response = await api.post(`/predictions/seed-dataset?count=${count}`);
  return response.data;
};

export const clearAllPredictions = async () => {
  const response = await api.delete('/predictions/clear/all');
  return response.data;
};

export const updateThresholds = async (thresholds) => {
  const response = await api.post('/model-info/thresholds', thresholds);
  return response.data;
};

export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

// Alerts & Escalation APIs
export const getAlerts = async (params = {}) => {
  const response = await api.get('/alerts', { params });
  return response.data;
};

export const acknowledgeAlert = async (id) => {
  const response = await api.post(`/alerts/${id}/acknowledge`);
  return response.data;
};

export const dispatchAlertNotification = async (id, payload) => {
  const response = await api.post(`/alerts/${id}/dispatch`, payload);
  return response.data;
};

export const getAuditLogs = async (limit = 50) => {
  const response = await api.get('/audit-logs', { params: { limit } });
  return response.data;
};

// Continuous Learning APIs
export const retrainModel = async () => {
  const response = await api.post('/model/retrain');
  return response.data;
};

export const getRetrainingHistory = async () => {
  const response = await api.get('/model/retrain/history');
  return response.data;
};

// Government Integrations & GIS APIs
export const getGeoJsonFeatures = async () => {
  const response = await api.get('/integrations/geojson');
  return response.data;
};

export const syncPmGatiShakti = async () => {
  const response = await api.get('/integrations/pm-gatishakti/sync');
  return response.data;
};

export const checkBhoomiStatus = async (projectId) => {
  const response = await api.get(`/integrations/bhoomi/status/${projectId}`);
  return response.data;
};

export const sendGovernmentEmail = async (emailData) => {
  const response = await api.post('/integrations/send-email', emailData);
  return response.data;
};

export const sendGovernmentSms = async (smsData) => {
  const response = await api.post('/integrations/send-sms', smsData);
  return response.data;
};

// ==================== AUTHENTICATION APIS ====================
export const apiRegister = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const apiLogin = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const apiGetMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const apiUpdateProfile = async (profileData) => {
  const response = await api.put('/auth/profile', profileData);
  return response.data;
};

export const apiChangePassword = async (passwordData) => {
  const response = await api.put('/auth/change-password', passwordData);
  return response.data;
};

export const apiForgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const apiResetPassword = async (resetData) => {
  const response = await api.post('/auth/reset-password', resetData);
  return response.data;
};

export const apiLogout = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

// ==================== ADMINISTRATOR APIS ====================
export const apiAdminGetUsers = async (params = {}) => {
  const response = await api.get('/admin/users', { params });
  return response.data;
};

export const apiAdminGetUserDetail = async (userId) => {
  const response = await api.get(`/admin/users/${userId}`);
  return response.data;
};

export const apiAdminUpdateUserStatus = async (userId, status) => {
  const response = await api.patch(`/admin/users/${userId}/status`, { status });
  return response.data;
};

export const apiAdminUpdateUserRole = async (userId, role) => {
  const response = await api.patch(`/admin/users/${userId}/role`, { role });
  return response.data;
};

export const apiAdminGetAuditLogs = async (params = {}) => {
  const response = await api.get('/admin/audit-logs', { params });
  return response.data;
};

export const apiAdminDeleteUser = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};

export default api;

