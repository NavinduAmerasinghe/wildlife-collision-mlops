import React from "react";

// PipelineOverview: shows pipeline stages and real artifact status if provided
function PipelineOverview({ pipelineStatus, loading, error }) {
  // Stages and their artifact keys
  const stages = [
    { name: "Bronze", desc: "Raw data ingestion", key: "bronze_available" },
    { name: "Silver", desc: "Data cleaning", key: "silver_available" },
    { name: "Gold", desc: "Feature engineering", key: "gold_available" },
    { name: "Model Training", desc: "ML model building", key: "model_available" },
    { name: "Model Comparison", desc: "Best model selection", key: "comparison_available" },
    { name: "FastAPI Serving", desc: "Model API deployment", key: "api_status" },
    { name: "Frontend Prediction", desc: "User interface", key: null },
  ];

  return (
    <section className="pipeline-overview">
      <h2>MLOps Pipeline</h2>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <div className="pipeline-stages">
          {stages.map((stage, idx) => {
            // Show status icon if key is present
            let status = null;
            if (stage.key && pipelineStatus) {
              status = pipelineStatus[stage.key] === true ? "✅" : "❌";
            }
            return (
              <div className="pipeline-stage" key={idx}>
                <div className="stage-name">
                  {stage.name} {status && <span>{status}</span>}
                </div>
                <div className="stage-desc">{stage.desc}</div>
                {idx < stages.length - 1 && <span className="stage-arrow">→</span>}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default PipelineOverview;
