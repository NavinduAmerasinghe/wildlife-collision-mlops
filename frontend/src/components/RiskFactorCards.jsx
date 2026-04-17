import React from "react";

// Visual cards for key risk factors
function RiskFactorCards({ input }) {
  if (!input) return null;
  const factors = [
    {
      label: "Precipitation",
      value: input.precipitation,
      unit: "mm",
      highlight: input.precipitation > 2,
    },
    {
      label: "Visibility",
      value: input.visibility,
      unit: "km",
      highlight: input.visibility < 3,
    },
    {
      label: "Speed Limit",
      value: input.speed_limit,
      unit: "km/h",
      highlight: input.speed_limit >= 80,
    },
    {
      label: "Night-Time",
      value: input.is_night ? "Yes" : "No",
      highlight: !!input.is_night,
    },
    {
      label: "Weekend",
      value: input.is_weekend ? "Yes" : "No",
      highlight: !!input.is_weekend,
    },
  ];
  return (
    <div className="risk-factor-cards">
      {factors.map((f, idx) => (
        <div
          className={`risk-factor-card${f.highlight ? " highlight" : ""}`}
          key={idx}
        >
          <div className="factor-label">{f.label}</div>
          <div className="factor-value">{f.value} {f.unit}</div>
        </div>
      ))}
    </div>
  );
}

export default RiskFactorCards;
