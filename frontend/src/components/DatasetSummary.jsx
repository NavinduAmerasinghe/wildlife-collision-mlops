import React from "react";

// DatasetSummary: shows real backend values if available, else fallback to placeholders
function DatasetSummary({ summary, loading, error }) {
  // Placeholders for demo if no data
  const fallback = {
    latest_gold_row_count: "-",
    selected_best_model: "-",
    latest_gold_batch_id: "-",
    latest_gold_created_at: "-",
    feature_count: "-",
  };
  const values = summary || fallback;

  return (
    <section className="dataset-summary-section">
      <h2>Dataset Summary</h2>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <div className="dataset-summary-cards">
          <div className="dataset-summary-card">
            <div className="summary-label">Gold Dataset Rows</div>
            <div className="summary-value">{values.latest_gold_row_count ?? "-"}</div>
          </div>
          <div className="dataset-summary-card">
            <div className="summary-label">Best Model</div>
            <div className="summary-value">{values.selected_best_model ?? "-"}</div>
          </div>
          <div className="dataset-summary-card">
            <div className="summary-label">Latest Gold Batch</div>
            <div className="summary-value">{values.latest_gold_batch_id ?? "-"}</div>
          </div>
          <div className="dataset-summary-card">
            <div className="summary-label">Created At</div>
            <div className="summary-value">{values.latest_gold_created_at ?? "-"}</div>
          </div>
          <div className="dataset-summary-card">
            <div className="summary-label">Input Features</div>
            <div className="summary-value">{values.feature_count ?? "-"}</div>
          </div>
        </div>
      )}
    </section>
  );
}

export default DatasetSummary;
