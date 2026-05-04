
import React, { useEffect, useState } from 'react';

// --- Types ---
type PipelineStatus = {
  bronze_available: boolean;
  silver_available: boolean;
  gold_available: boolean;
  model_available: boolean;
  comparison_available: boolean;
  api_status: boolean;
};

type DashboardSummary = {
  latest_gold_batch_id: string | null;
  latest_gold_row_count: number | null;
  latest_gold_created_at: string | null;
  feature_count: number | null;
  selected_best_model: string | null;
};

type ModelMetrics = {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
};

type ModelComparison = {
  batch_id: string | null;
  selected_best_model: string | null;
  logistic_regression: ModelMetrics | null;
  random_forest: ModelMetrics | null;
};

const API_BASE = 'http://127.0.0.1:8000';

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  return `${Math.round(value * 100)}%`;
}

function statusLabel(available: boolean): { label: string; color: string } {
  return available
    ? { label: 'Available', color: 'text-emerald-400' }
    : { label: 'Missing', color: 'text-rose-400' };
}

const featureList = [
  'temperature',
  'precipitation',
  'wind_speed',
  'visibility',
  'speed_limit',
  'hour',
  'month',
  'is_night',
  'is_weekend',
  'high_precipitation',
];

const AnalyticsandTrends: React.FC = () => {
  const [pipeline, setPipeline] = useState<PipelineStatus | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [comparison, setComparison] = useState<ModelComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`${API_BASE}/dashboard/pipeline-status`).then((r) => r.json()),
      fetch(`${API_BASE}/dashboard/summary`).then((r) => r.json()),
      fetch(`${API_BASE}/dashboard/model-comparison`).then((r) => r.json()),
    ])
      .then(([pipelineData, summaryData, comparisonData]) => {
        setPipeline(pipelineData);
        setSummary(summaryData);
        setComparison(comparisonData);
      })
      .catch((err) => {
        setError('Unable to load analytics data. Backend may be offline.');
      })
      .finally(() => setLoading(false));
  }, []);

  // --- Theme (dark mode) ---
  const darkBg = 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800';
  const lightBg = 'bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300';
  const cardDark = 'bg-gray-800 border border-slate-700';
  const cardLight = 'bg-white border border-slate-200';
  // TODO: Optionally use context for theme, fallback to dark
  const theme = 'dark';

  return (
    <div className={`min-h-screen w-full px-4 sm:px-6 lg:px-10 py-4 transition-colors duration-500 text-[15px] sm:text-base ${theme === 'dark' ? darkBg : lightBg}`}>
      <div className="w-full max-w-[1400px] mx-auto space-y-6">
        <div className="mb-1">
          <h1 className={`text-2xl sm:text-3xl font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>MLOps Analytics & Model Insights</h1>
          <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Analyze pipeline health, dataset readiness, and trained model performance for wildlife collision risk prediction.</p>
        </div>

        {/* Loading & Error States */}
        {loading ? (
          <div className="py-16 text-center text-slate-300 text-lg">Loading analytics…</div>
        ) : error ? (
          <div className="py-16 text-center text-rose-400 text-lg">{error}</div>
        ) : (
          <>
            {/* 1. Pipeline Readiness Overview */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-slate-100">Pipeline Readiness Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {pipeline && [
                  { key: 'bronze_available', label: 'Bronze', value: pipeline.bronze_available },
                  { key: 'silver_available', label: 'Silver', value: pipeline.silver_available },
                  { key: 'gold_available', label: 'Gold', value: pipeline.gold_available },
                  { key: 'model_available', label: 'Model', value: pipeline.model_available },
                  { key: 'comparison_available', label: 'Model Comparison', value: pipeline.comparison_available },
                  { key: 'api_status', label: 'API', value: pipeline.api_status },
                ].map((item) => {
                  const { label, color } = statusLabel(item.value);
                  return (
                    <div key={item.key} className={`rounded-xl p-4 text-center shadow ${theme === 'dark' ? cardDark : cardLight}`}>
                      <div className="font-semibold text-lg mb-1 text-slate-100">{item.label}</div>
                      <div className={`text-base font-bold ${color}`}>{label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Dataset & Feature Summary */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-slate-100">Dataset & Feature Summary</h2>
              <div className={`rounded-2xl p-5 shadow flex flex-col md:flex-row gap-6 ${theme === 'dark' ? cardDark : cardLight}`}>
                <div className="flex-1 space-y-2">
                  <div><span className="font-semibold text-slate-200">Latest Gold Batch ID:</span> <span className="ml-2 text-slate-100">{summary?.latest_gold_batch_id ?? 'N/A'}</span></div>
                  <div><span className="font-semibold text-slate-200">Gold Row Count:</span> <span className="ml-2 text-slate-100">{summary?.latest_gold_row_count ?? 'N/A'}</span></div>
                  <div><span className="font-semibold text-slate-200">Gold Created At:</span> <span className="ml-2 text-slate-100">{summary?.latest_gold_created_at ? new Date(summary.latest_gold_created_at).toLocaleString() : 'N/A'}</span></div>
                </div>
                <div className="flex-1 space-y-2">
                  <div><span className="font-semibold text-slate-200">Feature Count:</span> <span className="ml-2 text-slate-100">{summary?.feature_count ?? 'N/A'}</span></div>
                  <div><span className="font-semibold text-slate-200">Selected Best Model:</span> <span className={`ml-2 text-lg font-bold ${summary?.selected_best_model ? 'text-emerald-400' : 'text-slate-100'}`}>{summary?.selected_best_model ?? 'N/A'}</span></div>
                </div>
              </div>
            </div>

            {/* 3. Model Performance Comparison */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-slate-100">Model Performance Comparison</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {comparison && [
                  { key: 'logistic_regression', label: 'Logistic Regression', metrics: comparison.logistic_regression },
                  { key: 'random_forest', label: 'Random Forest', metrics: comparison.random_forest },
                ].map((model) => (
                  <div key={model.key} className={`rounded-2xl p-5 shadow flex flex-col gap-3 border-2 ${theme === 'dark' ? cardDark : cardLight} ${comparison.selected_best_model?.toLowerCase().includes(model.key.replace('_', ' ')) ? 'border-emerald-400' : 'border-transparent'}`}>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg text-slate-100">{model.label}</span>
                      {comparison.selected_best_model?.toLowerCase().includes(model.key.replace('_', ' ')) && (
                        <span className="ml-2 px-2 py-0.5 rounded bg-emerald-700 text-emerald-100 text-xs font-bold">Best</span>
                      )}
                    </div>
                    {model.metrics ? (
                      <div className="grid grid-cols-2 gap-2 text-slate-200">
                        <div>Accuracy: <span className="font-semibold">{formatPercent(model.metrics.accuracy)}</span></div>
                        <div>Precision: <span className="font-semibold">{formatPercent(model.metrics.precision)}</span></div>
                        <div>Recall: <span className="font-semibold">{formatPercent(model.metrics.recall)}</span></div>
                        <div>F1 Score: <span className="font-semibold">{formatPercent(model.metrics.f1_score)}</span></div>
                      </div>
                    ) : (
                      <div className="text-slate-400">No metrics available.</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Research Interpretation Panel */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-slate-100">Research Interpretation Panel</h2>
              <div className={`rounded-2xl p-5 shadow text-slate-200 text-base ${theme === 'dark' ? cardDark : cardLight}`}>
                <ul className="list-disc ml-6 space-y-2">
                  <li>Logistic Regression performed better in the current experiment.</li>
                  <li>The dataset is still small, so the results are only suitable for prototype validation.</li>
                  <li>The system demonstrates the MLOps workflow from data ingestion to prediction.</li>
                  <li>With larger real datasets, the same pipeline can support reliable decision-making.</li>
                </ul>
              </div>
            </div>

            {/* 5. Feature Usage Panel */}
            {(summary?.feature_count || comparison?.logistic_regression || comparison?.random_forest) && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-slate-100">Feature Usage Panel</h2>
                <div className={`rounded-2xl p-5 shadow text-slate-200 text-base ${theme === 'dark' ? cardDark : cardLight}`}>
                  <div>The model currently uses <span className="font-bold">{featureList.length}</span> input features:</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {featureList.map((f) => (
                      <span key={f} className="px-2 py-1 rounded bg-slate-700 text-slate-100 text-xs font-mono">{f}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsandTrends;