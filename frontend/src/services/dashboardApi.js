// API service functions for dashboard endpoints

const BASE_URL = "http://127.0.0.1:8000";

// Fetch /dashboard/summary
export async function fetchDashboardSummary() {
  const res = await fetch(`${BASE_URL}/dashboard/summary`);
  if (!res.ok) throw new Error("Failed to fetch dashboard summary");
  return await res.json();
}

// Fetch /dashboard/model-comparison
export async function fetchModelComparison() {
  const res = await fetch(`${BASE_URL}/dashboard/model-comparison`);
  if (!res.ok) throw new Error("Failed to fetch model comparison");
  return await res.json();
}

// Fetch /dashboard/pipeline-status
export async function fetchPipelineStatus() {
  const res = await fetch(`${BASE_URL}/dashboard/pipeline-status`);
  if (!res.ok) throw new Error("Failed to fetch pipeline status");
  return await res.json();
}
