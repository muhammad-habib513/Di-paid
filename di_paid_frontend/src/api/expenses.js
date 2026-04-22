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

// Get all expenses for the current user
export async function getExpenses() {
  const response = await axios.get(`${API_URL}/api/expenses`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Get expenses for a specific group
export async function getGroupExpenses(groupId) {
  const response = await axios.get(`${API_URL}/api/groups/${groupId}/expenses`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Create a new expense
export async function createExpense(expenseData) {
  const response = await axios.post(`${API_URL}/api/expenses`, expenseData, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Get a specific expense by ID
export async function getExpense(expenseId) {
  const response = await axios.get(`${API_URL}/api/expenses/${expenseId}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Update an expense
export async function updateExpense(expenseId, expenseData) {
  const response = await axios.put(`${API_URL}/api/expenses/${expenseId}`, expenseData, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Delete an expense
export async function deleteExpense(expenseId) {
  const response = await axios.delete(`${API_URL}/api/expenses/${expenseId}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Settle up an expense (mark as paid)
export async function settleExpense(expenseId, paymentData) {
  const response = await axios.post(`${API_URL}/api/expenses/${expenseId}/settle`, paymentData, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Get expense statistics
export async function getExpenseStats() {
  const response = await axios.get(`${API_URL}/api/expenses/stats`, {
    headers: getAuthHeaders(),
  });
  return response.data;
} 