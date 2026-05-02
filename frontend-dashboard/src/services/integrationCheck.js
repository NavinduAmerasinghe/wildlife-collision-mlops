// Simple integration check utility for FastAPI backend
export async function runIntegrationCheck() {
  const BASE_URL = "http://127.0.0.1:8000";
  const endpoints = [
    { key: "health", url: "/health" },
    { key: "summary", url: "/dashboard/summary" },
    { key: "pipelineStatus", url: "/dashboard/pipeline-status" },
    { key: "modelComparison", url: "/dashboard/model-comparison" },
  ];

  const result = {
    health: "failed",
    summary: "failed",
    pipelineStatus: "failed",
    modelComparison: "failed",
    errors: [],
  };

  await Promise.all(
    endpoints.map(async ({ key, url }) => {
      try {
        const res = await fetch(BASE_URL + url);
        if (res.ok) {
          result[key] = "ok";
        } else {
          const text = await res.text();
          result.errors.push(`${key}: HTTP ${res.status} - ${text}`);
        }
      } catch (err) {
        result.errors.push(`${key}: ${err.message}`);
      }
    })
  );

  return result;
}
