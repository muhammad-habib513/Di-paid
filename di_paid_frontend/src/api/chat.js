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

// Get multipart headers for file uploads
const getMultipartHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "multipart/form-data",
  };
};

// Chat Room Functions
export async function getChatRooms() {
  const response = await axios.get(`${API_URL}/api/chat/rooms`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

export async function getChatRoom(roomId) {
  const response = await axios.get(`${API_URL}/api/chat/rooms/${roomId}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Message Functions
export async function getMessages(roomId, page = 1, perPage = 50) {
  const response = await axios.get(
    `${API_URL}/api/chat/rooms/${roomId}/messages?page=${page}&per_page=${perPage}`,
    {
      headers: getAuthHeaders(),
    }
  );
  return response.data;
}

export async function sendMessage(roomId, content, messageType = "text", replyToId = null) {
  const response = await axios.post(
    `${API_URL}/api/chat/rooms/${roomId}/messages`,
    {
      content,
      message_type: messageType,
      reply_to_id: replyToId,
    },
    {
      headers: getAuthHeaders(),
    }
  );
  return response.data;
}

export async function editMessage(messageId, content) {
  const response = await axios.put(
    `${API_URL}/api/chat/messages/${messageId}`,
    { content },
    {
      headers: getAuthHeaders(),
    }
  );
  return response.data;
}

export async function deleteMessage(messageId) {
  const response = await axios.delete(`${API_URL}/api/chat/messages/${messageId}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

export async function markMessageRead(messageId) {
  const response = await axios.post(
    `${API_URL}/api/chat/messages/${messageId}/read`,
    {},
    {
      headers: getAuthHeaders(),
    }
  );
  return response.data;
}

// File Upload Functions
export async function uploadFile(roomId, file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post(
    `${API_URL}/api/chat/rooms/${roomId}/upload`,
    formData,
    {
      headers: getMultipartHeaders(),
    }
  );
  return response.data;
}

export function getFileUrl(filename) {
  return `${API_URL}/api/chat/files/${filename}`;
}

// Unread Count Functions
export async function getUnreadCount(roomId) {
  const response = await axios.get(`${API_URL}/api/chat/rooms/${roomId}/unread-count`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Real-time Chat Functions (for future WebSocket implementation)
export class ChatWebSocket {
  constructor(roomId, onMessage, onError) {
    this.roomId = roomId;
    this.onMessage = onMessage;
    this.onError = onError;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    try {
      const token = localStorage.getItem("token");
      // In a real implementation, you'd use WebSocket
      // this.ws = new WebSocket(`ws://localhost:5000/ws/chat/${this.roomId}?token=${token}`);
      
      // For now, we'll simulate with polling
      this.startPolling();
    } catch (error) {
      this.onError(error);
    }
  }

  startPolling() {
    // Simulate real-time updates with polling
    this.pollInterval = setInterval(async () => {
      try {
        const messages = await getMessages(this.roomId, 1, 10);
        if (messages.messages.length > 0) {
          this.onMessage(messages.messages[0]);
        }
      } catch (error) {
        this.onError(error);
      }
    }, 3000); // Poll every 3 seconds
  }

  disconnect() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    if (this.ws) {
      this.ws.close();
    }
  }

  sendMessage(content, messageType = "text", replyToId = null) {
    return sendMessage(this.roomId, content, messageType, replyToId);
  }
}

// Utility Functions
export function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function formatMessageTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (diffInHours < 24) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (diffInHours < 168) {
    return date.toLocaleDateString([], { weekday: "short" });
  } else {
    return date.toLocaleDateString();
  }
}

export function isImageFile(filename) {
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];
  const extension = filename.split(".").pop().toLowerCase();
  return imageExtensions.includes(extension);
}

export function isVideoFile(filename) {
  const videoExtensions = ["mp4", "avi", "mov", "wmv", "flv", "webm"];
  const extension = filename.split(".").pop().toLowerCase();
  return videoExtensions.includes(extension);
} 