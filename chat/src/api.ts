

// import axios from "axios";

// const api = axios.create({
//   baseURL: "http://localhost:5000",
// });

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   config.headers["Content-Type"] = "application/json";
//   return config;
// });

// export default api;

import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000",
});

// Request interceptor to add token and set content type
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Only set Content-Type to application/json if it's not a file upload
  if (!(config.data instanceof FormData)) {
    config.headers["Content-Type"] = "application/json";
  }
  return config;
});

// Response interceptor for error handling (optional)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access (e.g., redirect to login)
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Specific method for file uploads
export const uploadFile = async (
  file: File,
  type: "image" | "audio",
  sender: string,
  receiver: string
) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);
  formData.append("sender", sender);
  formData.append("receiver", receiver);

  const response = await api.post("/api/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// CRUD operations
export const login = (data: { email: string; password: string }) =>
  api.post("/api/login", data);

export const register = (data: { email: string; password: string }) =>
  api.post("/api/register", data);

export const getContacts = () => api.get("/api/contacts");

export const getMessages = (contactEmail: string) =>
  api.get(`/api/messages/${contactEmail}`);

export const sendMessage = (data: {
  receiver: string;
  content: string;
  messageType?: string;
  fileUrl?: string;
}) => api.post("/api/messages/send", data);

export const markMessagesAsRead = (data: { sender: string }) =>
  api.post("/api/messages/read", data);

// Export the axios instance as default
export default api;