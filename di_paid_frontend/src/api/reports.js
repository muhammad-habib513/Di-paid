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

// Get spending overview for the current user
export async function getSpendingOverview() {
  const response = await axios.get(`${API_URL}/api/reports/spending-overview`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Get monthly spending trends
export async function getMonthlySpendingTrends(months = 6) {
  const response = await axios.get(`${API_URL}/api/reports/monthly-trends?months=${months}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Get group spending breakdown
export async function getGroupSpendingBreakdown() {
  const response = await axios.get(`${API_URL}/api/reports/group-breakdown`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Get payment history with filters
export async function getPaymentHistory(filters = {}) {
  const params = new URLSearchParams(filters);
  const response = await axios.get(`${API_URL}/api/reports/payment-history?${params}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Get expense categories breakdown
export async function getExpenseCategories() {
  const response = await axios.get(`${API_URL}/api/reports/expense-categories`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Get user activity summary
export async function getUserActivitySummary() {
  const response = await axios.get(`${API_URL}/api/reports/user-activity`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Get settlement recommendations
export async function getSettlementRecommendations() {
  const response = await axios.get(`${API_URL}/api/reports/settlement-recommendations`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Export report data
export async function exportReport(reportType, format = 'json', filters = {}) {
  const params = new URLSearchParams({ ...filters, format });
  const response = await axios.get(`${API_URL}/api/reports/export/${reportType}?${params}`, {
    headers: getAuthHeaders(),
    responseType: 'blob',
  });
  return response.data;
} 