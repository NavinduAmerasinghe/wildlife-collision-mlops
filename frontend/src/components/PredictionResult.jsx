import React from "react";

function PredictionResult({ result }) {
  if (!result) return null;
  return (
    <div className="result-card">
      <h2>Prediction Result</h2>
      <div><strong>Predicted Class:</strong> {result.predicted_class}</div>
      <div><strong>Risk Label:</strong> {result.risk_label}</div>
      <div><strong>Probability:</strong> {result.probability !== null ? result.probability.toFixed(2) : "N/A"}</div>
    </div>
  );
}

export default PredictionResult;
