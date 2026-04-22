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

// Get all payments for the current user
export async function getPayments() {
  const response = await axios.get(`${API_URL}/api/payments`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Get payments for a specific group
export async function getGroupPayments(groupId) {
  const response = await axios.get(`${API_URL}/api/groups/${groupId}/payments`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Create a new payment
export async function createPayment(paymentData) {
  const response = await axios.post(`${API_URL}/api/payments`, paymentData, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Get a specific payment by ID
export async function getPayment(paymentId) {
  const response = await axios.get(`${API_URL}/api/payments/${paymentId}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Update a payment status
export async function updatePayment(paymentId, paymentData) {
  const response = await axios.put(`${API_URL}/api/payments/${paymentId}`, paymentData, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Delete a payment
export async function deletePayment(paymentId) {
  const response = await axios.delete(`${API_URL}/api/payments/${paymentId}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Mark payment as received
export async function markPaymentReceived(paymentId) {
  const response = await axios.post(`${API_URL}/api/payments/${paymentId}/receive`, {}, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Get payment statistics
export async function getPaymentStats() {
  const response = await axios.get(`${API_URL}/api/payments/stats`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Get user balances across all groups
export async function getUserBalances() {
  const response = await axios.get(`${API_URL}/api/payments/balances`, {
    headers: getAuthHeaders(),
  });
  return response.data;
} 