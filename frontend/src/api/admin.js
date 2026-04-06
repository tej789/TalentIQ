import axios from "../lib/axios";

// Admin Dashboard Stats
export const getAdminDashboard = async () => {
  const { data } = await axios.get("/admin/dashboard");
  return data;
};

// Problem Management
export const getAllProblems = async () => {
  const { data } = await axios.get("/admin/problems");
  return data;
};

export const createProblem = async (problemData) => {
  const { data } = await axios.post("/admin/problem", problemData);
  return data;
};

export const updateProblem = async (problemId, problemData) => {
  const { data } = await axios.put(`/admin/problem/${problemId}`, problemData);
  return data;
};

export const deleteProblem = async (problemId) => {
  const { data } = await axios.delete(`/admin/problem/${problemId}`);
  return data;
};

export const getProblemByIdAdmin = async (problemId) => {
  const { data } = await axios.get(`/admin/problem/${problemId}`);
  return data;
};

// Submissions
export const getAllSubmissions = async () => {
  const { data } = await axios.get("/admin/submissions");
  return data;
};

// User Submission APIs
export const getMySubmission = async (problemId) => {
  const { data } = await axios.get(`/submissions/${problemId}`);
  return data; // Returns { submission: {...} } or { submission: null }
};

export const submitCode = async (problemId, submissionData) => {
  const { data } = await axios.post(`/submissions/${problemId}`, submissionData);
  return data;
};

export const getPreferredLanguage = async () => {
  const { data } = await axios.get("/submissions/preferred-language");
  return data;
};
