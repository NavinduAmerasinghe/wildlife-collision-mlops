import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export const checkHealth = async () => {
  const res = await api.get("/health");
  return res.data;
};

export const predictRisk = async (payload) => {
  const res = await api.post("/predict", payload);
  return res.data;
};

export const fetchDashboardSummary = async () => {
  const res = await api.get("/dashboard/summary");
  return res.data;
};

export const fetchPipelineStatus = async () => {
  const res = await api.get("/dashboard/pipeline-status");
  return res.data;
};

export const fetchModelComparison = async () => {
  const res = await api.get("/dashboard/model-comparison");
  return res.data;
};
