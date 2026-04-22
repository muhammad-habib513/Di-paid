import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

export async function login(email, password) {
  const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
  return response.data;
}

export async function register(name, email, password) {
  const response = await axios.post(`${API_URL}/api/auth/register`, { name, email, password });
  return response.data;
} 