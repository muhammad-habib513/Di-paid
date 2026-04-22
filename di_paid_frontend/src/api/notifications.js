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

// Get all notifications for the current user
export async function getNotifications() {
  const response = await axios.get(`${API_URL}/api/notifications`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Get unread notifications count
export async function getUnreadCount() {
  const response = await axios.get(`${API_URL}/api/notifications/unread-count`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Mark a notification as read
export async function markAsRead(notificationId) {
  const response = await axios.put(`${API_URL}/api/notifications/${notificationId}/read`, {}, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Mark all notifications as read
export async function markAllAsRead() {
  const response = await axios.put(`${API_URL}/api/notifications/mark-all-read`, {}, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Delete a notification
export async function deleteNotification(notificationId) {
  const response = await axios.delete(`${API_URL}/api/notifications/${notificationId}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Get notification preferences
export async function getNotificationPreferences() {
  const response = await axios.get(`${API_URL}/api/notifications/preferences`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Update notification preferences
export async function updateNotificationPreferences(preferences) {
  const response = await axios.put(`${API_URL}/api/notifications/preferences`, preferences, {
    headers: getAuthHeaders(),
  });
  return response.data;
} 