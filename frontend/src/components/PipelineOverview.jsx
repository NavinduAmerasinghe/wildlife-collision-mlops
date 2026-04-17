import React from "react";

// Visual pipeline overview
function PipelineOverview() {
  const stages = [
    { name: "Bronze", desc: "Raw data ingestion" },
    { name: "Silver", desc: "Data cleaning" },
    { name: "Gold", desc: "Feature engineering" },
    { name: "Model Training", desc: "ML model building" },
    { name: "Model Comparison", desc: "Best model selection" },
    { name: "FastAPI Serving", desc: "Model API deployment" },
    { name: "Frontend Prediction", desc: "User interface" }
  ];
  return (
    <section className="pipeline-overview">
      <h2>MLOps Pipeline</h2>
      <div className="pipeline-stages">
        {stages.map((stage, idx) => (
          <div className="pipeline-stage" key={idx}>
            <div className="stage-name">{stage.name}</div>
            <div className="stage-desc">{stage.desc}</div>
            {idx < stages.length - 1 && <span className="stage-arrow">→</span>}
          </div>
        ))}
      </div>
    </section>
  );
}

export default PipelineOverview;
