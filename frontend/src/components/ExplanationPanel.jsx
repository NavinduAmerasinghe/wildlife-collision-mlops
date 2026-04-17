import React from "react";

// Simple rule-based explanation panel
function ExplanationPanel({ input, result }) {
  if (!input) return null;

  // Rule-based explanations
  const explanations = [];
  if (input.precipitation > 2) explanations.push("High precipitation may increase collision risk.");
  if (input.visibility < 3) explanations.push("Low visibility may reduce driver reaction time.");
  if (input.is_night) explanations.push("Night-time may increase wildlife activity risk.");
  if (input.speed_limit >= 80) explanations.push("Higher speed limits may increase accident severity.");
  if (input.high_precipitation) explanations.push("Heavy precipitation detected.");
  if (input.is_weekend) explanations.push("Weekend travel may see different wildlife patterns.");
  if (explanations.length === 0) explanations.push("Conditions appear typical; always drive with caution.");

  return (
    <div className="explanation-panel">
      <h4>Explanation</h4>
      <ul>
        {explanations.map((ex, idx) => (
          <li key={idx}>{ex}</li>
        ))}
      </ul>
    </div>
  );
}

export default ExplanationPanel;
