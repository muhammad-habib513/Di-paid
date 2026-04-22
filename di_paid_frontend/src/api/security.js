import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

// Get auth token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

// 2FA Functions
export async function setup2FA() {
  const response = await axios.post(`${API_URL}/api/security/2fa/setup`, {}, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

export async function verify2FASetup(code) {
  const response = await axios.post(`${API_URL}/api/security/2fa/verify`, { code }, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

export async function disable2FA(code) {
  const response = await axios.post(`${API_URL}/api/security/2fa/disable`, { code }, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

export async function get2FAStatus() {
  const response = await axios.get(`${API_URL}/api/security/2fa/status`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Session Management Functions
export async function getSessions() {
  const response = await axios.get(`${API_URL}/api/security/sessions`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

export async function revokeSession(sessionId) {
  const response = await axios.delete(`${API_URL}/api/security/sessions/${sessionId}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

export async function revokeAllSessions() {
  const response = await axios.post(`${API_URL}/api/security/sessions/revoke-all`, {}, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Security Settings Functions
export async function getSecuritySettings() {
  const response = await axios.get(`${API_URL}/api/security/settings`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

export async function updateSecuritySettings(settings) {
  const response = await axios.put(`${API_URL}/api/security/settings`, settings, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Audit Logs Functions
export async function getAuditLogs(page = 1, perPage = 20) {
  const response = await axios.get(`${API_URL}/api/security/audit-logs?page=${page}&per_page=${perPage}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Password Change Function
export async function changePassword(currentPassword, newPassword) {
  const response = await axios.post(`${API_URL}/api/security/change-password`, {
    current_password: currentPassword,
    new_password: newPassword
  }, {
    headers: getAuthHeaders(),
  });
  return response.data;
} 