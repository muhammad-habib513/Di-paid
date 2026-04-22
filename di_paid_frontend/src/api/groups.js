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

// Get all groups for the current user
export async function getGroups() {
  const response = await axios.get(`${API_URL}/api/groups`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Create a new group
export async function createGroup(groupData) {
  const response = await axios.post(`${API_URL}/api/groups`, groupData, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Get a specific group by ID
export async function getGroup(groupId) {
  const response = await axios.get(`${API_URL}/api/groups/${groupId}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Update a group
export async function updateGroup(groupId, groupData) {
  const response = await axios.put(`${API_URL}/api/groups/${groupId}`, groupData, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Delete a group
export async function deleteGroup(groupId) {
  const response = await axios.delete(`${API_URL}/api/groups/${groupId}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Add a member to a group
export async function addMember(groupId, userId) {
  const response = await axios.post(
    `${API_URL}/api/groups/${groupId}/members`,
    { user_id: userId },
    {
      headers: getAuthHeaders(),
    }
  );
  return response.data;
}

// Remove a member from a group
export async function removeMember(groupId, userId) {
  const response = await axios.delete(
    `${API_URL}/api/groups/${groupId}/members/${userId}`,
    {
      headers: getAuthHeaders(),
    }
  );
  return response.data;
}

// Get all users (for adding to groups)
export async function getUsers() {
  const response = await axios.get(`${API_URL}/api/users`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

