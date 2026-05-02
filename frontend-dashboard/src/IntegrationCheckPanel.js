import React, { useState } from "react";
import { runIntegrationCheck } from "../services/integrationCheck";

const statusColor = (status) => {
  if (status === "ok") return "green";
  if (status === "failed") return "red";
  return "black";
};

export default function IntegrationCheckPanel() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    setLoading(true);
    setResult(null);
    const res = await runIntegrationCheck();
    setResult(res);
    setLoading(false);
  };

  return (
    <div style={{ margin: 24, padding: 16, border: "1px solid #ccc", borderRadius: 8, maxWidth: 400 }}>
      <button onClick={handleCheck} disabled={loading} style={{ marginBottom: 16 }}>
        {loading ? "Checking..." : "Run Integration Check"}
      </button>
      {result && (
        <div>
          <div>
            <b>Health:</b> <span style={{ color: statusColor(result.health) }}>{result.health}</span>
          </div>
          <div>
            <b>Summary:</b> <span style={{ color: statusColor(result.summary) }}>{result.summary}</span>
          </div>
          <div>
            <b>Pipeline Status:</b> <span style={{ color: statusColor(result.pipelineStatus) }}>{result.pipelineStatus}</span>
          </div>
          <div>
            <b>Model Comparison:</b> <span style={{ color: statusColor(result.modelComparison) }}>{result.modelComparison}</span>
          </div>
          {result.errors.length > 0 && (
            <div style={{ color: "red", marginTop: 8 }}>
              <b>Errors:</b>
              <ul>
                {result.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
