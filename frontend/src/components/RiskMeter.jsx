import React from "react";

// RiskMeter: shows probability visually as a meter/progress bar
function RiskMeter({ probability, riskLabel }) {
  // Clamp probability between 0 and 1
  const pct = Math.max(0, Math.min(1, probability ?? 0));
  const color = pct >= 0.7 ? "#d32f2f" : pct >= 0.4 ? "#fbc02d" : "#388e3c";
  const label = riskLabel === "high_risk" ? "High Risk" : "Low Risk";
  return (
    <div className="risk-meter">
      <div className="risk-meter-label">
        <span style={{ color }}>{label}</span>
        <span className="risk-meter-prob">{(pct * 100).toFixed(0)}%</span>
      </div>
      <div className="risk-meter-bar-bg">
        <div
          className="risk-meter-bar"
          style={{ width: `${pct * 100}%`, background: color }}
        ></div>
      </div>
    </div>
  );
}

export default RiskMeter;
