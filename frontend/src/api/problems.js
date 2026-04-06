import axiosInstance from "../lib/axios";

export const getAllProblems = async () => {
  const response = await axiosInstance.get("/problems");
  return response.data;
};

export const getProblemById = async (id) => {
  const response = await axiosInstance.get(`/problems/${id}`);
  return response.data;
};

export const getProblemTestCases = async (id) => {
  const response = await axiosInstance.get(`/problems/${id}/test-cases`);
  return response.data;
};
