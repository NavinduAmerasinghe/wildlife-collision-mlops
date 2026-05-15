import React, { useEffect, useState } from 'react';
import { ModelMetricsChart } from '../components/ModelMetricsChart';
import { DatasetUploadHistoryChart } from '../components/DatasetUploadHistoryChart';
import apiClient from '../utils/apiClient';

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

type Upload = {
  _id: string;
  created_at: string;
  row_count: number;
  [key: string]: unknown;
};

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
  const [uploadsData, setUploadsData] = useState<Upload[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload & pipeline state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<any>(null);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [pipelineResult, setPipelineResult] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      apiClient.get(`/dashboard/pipeline-status`).then((r) => r.data),
      apiClient.get(`/dashboard/summary`).then((r) => r.data),
      apiClient.get(`/dashboard/model-comparison`).then((r) => r.data),
      apiClient.get(`/data/uploads/history`).then((r) => r.data),
    ])
      .then(([pipelineData, summaryData, comparisonData, uploadsResponse]) => {
        setPipeline(pipelineData ?? null);
        setSummary(summaryData ?? null);
        setComparison(comparisonData ?? null);
        setUploadsData((uploadsResponse && uploadsResponse.uploads) || null);
      })
      .catch(() => setError('Unable to load analytics data. Backend may be offline.'))
      .finally(() => setLoading(false));
  }, []);

  // --- Theme (dark mode) ---
  const darkBg = 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800';
  const lightBg = 'bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300';
  const cardDark = 'bg-gray-800 border border-slate-700';
  const cardLight = 'bg-white border border-slate-200';
  const theme = 'dark';

  return (
    <div className={`${theme === 'dark' ? darkBg : lightBg} w-full h-full`}> 
      <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10 py-6">

        <header className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-100">MLOps Analytics & Model Insights</h1>
          <p className="mt-1 text-sm text-slate-400">Analyze pipeline health, dataset readiness, and trained model performance for wildlife collision risk prediction.</p>
        </header>

        {loading ? (
          <div className="py-16 text-center text-slate-300 text-lg">Loading analytics…</div>
        ) : error ? (
          <div className="py-16 text-center text-rose-400 text-lg">{error}</div>
        ) : (
          <div className="space-y-6">
            {/* Section 1: Pipeline cards (full width) */}
            <section>
              <h2 className="text-xl font-semibold mb-4 text-slate-100">Pipeline Readiness Overview</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
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
            </section>

            {/* Section 2: Dataset & Feature Summary (grid of 4) */}
            <section>
              <h2 className="text-xl font-semibold mb-4 text-slate-100">Dataset & Feature Summary</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`rounded-xl p-4 shadow ${theme === 'dark' ? cardDark : cardLight}`}>
                  <div className="text-sm text-slate-400">Latest Gold Batch ID</div>
                  <div className="text-lg font-semibold text-slate-100 mt-2">{summary?.latest_gold_batch_id ?? 'N/A'}</div>
                </div>
                <div className={`rounded-xl p-4 shadow ${theme === 'dark' ? cardDark : cardLight}`}>
                  <div className="text-sm text-slate-400">Gold Row Count</div>
                  <div className="text-lg font-semibold text-slate-100 mt-2">{summary?.latest_gold_row_count ?? 'N/A'}</div>
                </div>
                <div className={`rounded-xl p-4 shadow ${theme === 'dark' ? cardDark : cardLight}`}>
                  <div className="text-sm text-slate-400">Gold Created At</div>
                  <div className="text-lg font-semibold text-slate-100 mt-2">{summary?.latest_gold_created_at ? new Date(summary.latest_gold_created_at).toLocaleString() : 'N/A'}</div>
                </div>
                <div className={`rounded-xl p-4 shadow ${theme === 'dark' ? cardDark : cardLight}`}>
                  <div className="text-sm text-slate-400">Feature Count</div>
                  <div className="text-lg font-semibold text-slate-100 mt-2">{summary?.feature_count ?? 'N/A'}</div>
                </div>
              </div>

              <div className="mt-4">
                <div className={`rounded-2xl p-4 shadow ${theme === 'dark' ? cardDark : cardLight}`}>
                  <div className="text-sm text-slate-400">Selected Best Model</div>
                  <div className={`text-lg font-bold mt-2 ${summary?.selected_best_model ? 'text-emerald-400' : 'text-slate-100'}`}>{summary?.selected_best_model ?? 'N/A'}</div>
                </div>
              </div>
            </section>

            {/* Section 3: Two-column grid (left: comparison+interpretation, right: metrics chart) */}
            <section>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-slate-100">Model Performance Comparison</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {comparison ? (
                        [
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
                        ))
                      ) : (
                        <div className="text-slate-400">No model comparison available.</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-slate-100">Research Interpretation</h3>
                    <div className={`rounded-2xl p-4 shadow ${theme === 'dark' ? cardDark : cardLight}`}>
                      <ul className="list-disc ml-6 space-y-2 text-slate-200">
                        <li>Logistic Regression performed better in the current experiment.</li>
                        <li>The dataset is still small, so the results are only suitable for prototype validation.</li>
                        <li>The system demonstrates the MLOps workflow from data ingestion to prediction.</li>
                        <li>With larger real datasets, the same pipeline can support reliable decision-making.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 text-slate-100">Model Metrics Chart</h3>
                  <div className={`rounded-2xl p-4 shadow ${theme === 'dark' ? cardDark : cardLight}`}>
                    <ModelMetricsChart logisticRegression={comparison?.logistic_regression} randomForest={comparison?.random_forest} />
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: Two-column grid (left: uploads chart, right: upload & retraining) */}
            <section>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-slate-100">Dataset Upload History</h3>
                  <div className={`rounded-2xl p-4 shadow ${theme === 'dark' ? cardDark : cardLight}`}>
                    {uploadsData && uploadsData.length > 0 ? (
                      <DatasetUploadHistoryChart uploads={uploadsData} />
                    ) : (
                      <div className="flex items-center justify-center h-60 text-slate-400">No chart data available yet.</div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 text-slate-100">Dataset Upload & Retraining</h3>
                  <div className={`rounded-2xl p-4 shadow ${theme === 'dark' ? cardDark : cardLight}`}>
                    <form
                      className="flex flex-col md:flex-row items-center gap-4"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!uploadFile) return;
                        setUploadError(null);
                        setUploadSuccess(null);
                        setUploadLoading(true);
                        try {
                          const formData = new FormData();
                          formData.append('file', uploadFile);
                          const res = await apiClient.post(`/data/upload/wildlife`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                          const data = res.data;
                          if (data.status !== 'success') {
                            setUploadError(data.detail || 'Upload failed.');
                            setUploadSuccess(null);
                          } else {
                            setUploadSuccess(data);
                            setUploadError(null);
                          }
                        } catch (err) {
                          setUploadError('Upload failed.');
                          setUploadSuccess(null);
                        } finally {
                          setUploadLoading(false);
                        }
                      }}
                    >
                      <input
                        type="file"
                        accept=".csv"
                        className="block w-full text-sm text-slate-200 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-slate-100 hover:file:bg-slate-600"
                        onChange={(e) => {
                          setUploadFile(e.target.files?.[0] || null);
                          setUploadError(null);
                          setUploadSuccess(null);
                        }}
                        disabled={uploadLoading || pipelineLoading}
                      />

                      <button type="submit" className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-60" disabled={!uploadFile || uploadLoading || pipelineLoading}>
                        {uploadLoading ? 'Uploading…' : 'Upload Dataset'}
                      </button>
                    </form>

                    {uploadError && <div className="text-rose-400 text-sm mt-3">{uploadError}</div>}
                    {uploadSuccess && (
                      <div className="text-emerald-300 text-sm mt-3">Uploaded <span className="font-bold">{uploadSuccess.file_path}</span> with <span className="font-bold">{uploadSuccess.row_count}</span> rows.</div>
                    )}

                    <div className="mt-4">
                      <button
                        className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold w-fit disabled:opacity-60"
                        disabled={!uploadSuccess || pipelineLoading}
                        onClick={async () => {
                          setPipelineError(null);
                          setPipelineResult(null);
                          setPipelineLoading(true);
                          try {
                            const res = await apiClient.post(`/pipeline/run`);
                            const data = res.data;
                            if (data.status !== 'success') {
                              setPipelineError(data.detail || 'Pipeline run failed.');
                              setPipelineResult(null);
                            } else {
                              setPipelineResult(data);
                              setPipelineError(null);
                              // Refresh dashboard data after pipeline run
                              setLoading(true);
                              setError(null);
                              Promise.all([
                                apiClient.get(`/dashboard/pipeline-status`).then((r) => r.data),
                                apiClient.get(`/dashboard/summary`).then((r) => r.data),
                                apiClient.get(`/dashboard/model-comparison`).then((r) => r.data),
                              ])
                                .then(([pipelineData, summaryData, comparisonData]) => {
                                  setPipeline(pipelineData ?? null);
                                  setSummary(summaryData ?? null);
                                  setComparison(comparisonData ?? null);
                                })
                                .catch(() => setError('Unable to refresh analytics data after pipeline run.'))
                                .finally(() => setLoading(false));
                            }
                          } catch (err) {
                            setPipelineError('Pipeline run failed.');
                            setPipelineResult(null);
                          } finally {
                            setPipelineLoading(false);
                          }
                        }}
                      >
                        {pipelineLoading ? 'Running Pipeline…' : 'Run Pipeline'}
                      </button>

                      {pipelineError && <div className="text-rose-400 text-sm mt-3">{pipelineError}</div>}

                      {pipelineResult && (
                        <div className="mt-3">
                          {pipelineResult.status === 'success' ? (
                            <div className="text-emerald-300 text-sm mb-2">Pipeline completed successfully.</div>
                          ) : (
                            <div className="text-rose-400 text-sm mb-2">Pipeline failed.</div>
                          )}
                        </div>
                      )}

                      <div className="text-xs text-slate-400 mt-3">
                        <span className="font-semibold">Note:</span> Upload a new wildlife incident CSV to the raw data layer. After upload, click <span className="font-bold">Run Pipeline</span> to retrain the model and refresh analytics. Only .csv files are accepted.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsandTrends;
