import React from "react";

// Dataset summary cards (static/mock values for now)
function DatasetSummary() {
  const summary = [
    { label: "Total Incidents", value: 1240 },
    { label: "Gold Dataset Rows", value: 1180 },
    { label: "Input Features", value: 10 },
    { label: "Best Model", value: "RandomForestClassifier" },
    { label: "Latest Batch", value: "2026-04-15" },
  ];
  return (
    <section className="dataset-summary-section">
      <h2>Dataset Summary</h2>
      <div className="dataset-summary-cards">
        {summary.map((item, idx) => (
          <div className="dataset-summary-card" key={idx}>
            <div className="summary-label">{item.label}</div>
            <div className="summary-value">{item.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default DatasetSummary;
