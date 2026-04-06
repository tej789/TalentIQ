import axiosInstance from "../lib/axios";

export const sessionApi = {
  // Check if the current user is already in an active session
  checkActiveSession: async () => {
    const response = await axiosInstance.get("/sessions/check-active");
    return response.data;
  },

  createSession: async (data) => {
    const response = await axiosInstance.post("/sessions", data);
    return response.data;
  },

  getActiveSessions: async (search = "") => {
    const params = search ? { search } : {};
    const response = await axiosInstance.get("/sessions/active", { params });
    return response.data;
  },
  getMyRecentSessions: async () => {
    const response = await axiosInstance.get("/sessions/my-recent");
    return response.data;
  },

  getSessionById: async (id) => {
    const response = await axiosInstance.get(`/sessions/${id}`);
    return response.data;
  },

  joinSession: async ({ id, password }) => {
    const response = await axiosInstance.post(`/sessions/${id}/join`, { password });
    return response.data;
  },
  endSession: async (id) => {
    const response = await axiosInstance.post(`/sessions/${id}/end`);
    return response.data;
  },
  leaveSession: async (id) => {
    const response = await axiosInstance.post(`/sessions/${id}/leave`);
    return response.data;
  },
  validatePassword: async ({ id, password }) => {
    const response = await axiosInstance.post(`/sessions/${id}/validate-password`, { password });
    return response.data;
  },
  getSessionHistory: async (id) => {
    const response = await axiosInstance.get(`/sessions/${id}/history`);
    return response.data;
  },
  getStreamToken: async (callId) => {
    const params = callId ? { callId } : {};
    const response = await axiosInstance.get(`/chat/token`, { params });
    return response.data;
  },
};
