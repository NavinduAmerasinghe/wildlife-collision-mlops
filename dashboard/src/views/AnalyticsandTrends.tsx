
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
              <>
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

                {/* Risk Pattern Insights Section */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4 text-slate-100">Risk Pattern Insights</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Night-Time Risk Pattern */}
                    <div className={`rounded-2xl p-5 shadow flex flex-col gap-2 border-l-4 border-indigo-500 ${theme === 'dark' ? cardDark : cardLight}`}>
                      <div className="font-semibold text-lg text-indigo-300 mb-1">Night-Time Risk Pattern</div>
                      <div className="text-slate-200 mb-2">Wildlife collision risk can increase during night hours because driver visibility is lower and animal activity may be harder to detect.</div>
                      <div className="text-xs text-slate-400">Related features: <span className="font-mono text-slate-300">is_night</span>, <span className="font-mono text-slate-300">hour</span></div>
                    </div>
                    {/* Weather-Based Risk Pattern */}
                    <div className={`rounded-2xl p-5 shadow flex flex-col gap-2 border-l-4 border-cyan-500 ${theme === 'dark' ? cardDark : cardLight}`}>
                      <div className="font-semibold text-lg text-cyan-300 mb-1">Rain and Visibility Pattern</div>
                      <div className="text-slate-200 mb-2">Precipitation and reduced visibility can increase uncertainty on roads, making wildlife detection more difficult.</div>
                      <div className="text-xs text-slate-400">Related features: <span className="font-mono text-slate-300">precipitation</span>, <span className="font-mono text-slate-300">visibility</span>, <span className="font-mono text-slate-300">high_precipitation</span></div>
                    </div>
                    {/* Speed Context Pattern */}
                    <div className={`rounded-2xl p-5 shadow flex flex-col gap-2 border-l-4 border-rose-500 ${theme === 'dark' ? cardDark : cardLight}`}>
                      <div className="font-semibold text-lg text-rose-300 mb-1">Speed Limit Pattern</div>
                      <div className="text-slate-200 mb-2">Higher speed limits may increase collision severity and reduce driver reaction time in wildlife-prone areas.</div>
                      <div className="text-xs text-slate-400">Related features: <span className="font-mono text-slate-300">speed_limit</span></div>
                    </div>
                    {/* Seasonal/Temporal Pattern */}
                    <div className={`rounded-2xl p-5 shadow flex flex-col gap-2 border-l-4 border-amber-500 ${theme === 'dark' ? cardDark : cardLight}`}>
                      <div className="font-semibold text-lg text-amber-300 mb-1">Seasonal and Weekend Pattern</div>
                      <div className="text-slate-200 mb-2">Month and weekend indicators help the model capture seasonal movement and travel behavior patterns.</div>
                      <div className="text-xs text-slate-400">Related features: <span className="font-mono text-slate-300">month</span>, <span className="font-mono text-slate-300">is_weekend</span></div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* 6. Dataset Upload & Retraining */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-slate-100">Dataset Upload & Retraining</h2>
              <div className={`rounded-2xl p-5 shadow flex flex-col gap-4 ${theme === 'dark' ? cardDark : cardLight}`}>
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
                      const res = await fetch(`${API_BASE}/data/upload/wildlife`, {
                        method: 'POST',
                        body: formData,
                      });
                      const data = await res.json();
                      if (!res.ok || data.status !== 'success') {
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
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-60"
                    disabled={!uploadFile || uploadLoading || pipelineLoading}
                  >
                    {uploadLoading ? 'Uploading…' : 'Upload Dataset'}
                  </button>
                </form>
                {uploadError && <div className="text-rose-400 text-sm">{uploadError}</div>}
                {uploadSuccess && (
                  <div className="text-emerald-300 text-sm">
                    Uploaded <span className="font-bold">{uploadSuccess.file_path}</span> with <span className="font-bold">{uploadSuccess.row_count}</span> rows.
                  </div>
                )}
                <button
                  className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold w-fit disabled:opacity-60"
                  style={{ marginTop: 8 }}
                  disabled={!uploadSuccess || pipelineLoading}
                  onClick={async () => {
                    setPipelineError(null);
                    setPipelineResult(null);
                    setPipelineLoading(true);
                    try {
                      const res = await fetch(`${API_BASE}/pipeline/run`, { method: 'POST' });
                      const data = await res.json();
                      if (!res.ok || data.status !== 'success') {
                        setPipelineError(data.detail || 'Pipeline run failed.');
                        setPipelineResult(null);
                      } else {
                        setPipelineResult(data);
                        setPipelineError(null);
                        // Refresh dashboard data after pipeline run
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
                          .catch(() => {
                            setError('Unable to refresh analytics data after pipeline run.');
                          })
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
                {pipelineError && (
                  <div className="text-rose-400 text-sm mt-1">
                    {typeof pipelineError === 'string' ? pipelineError : <pre className="whitespace-pre-wrap">{JSON.stringify(pipelineError, null, 2)}</pre>}
                  </div>
                )}
                {pipelineResult && (
                  <div className="mt-2">
                    {pipelineResult.status === 'success' ? (
                      <div className="text-emerald-300 text-sm mb-2">Pipeline completed successfully.</div>
                    ) : (
                      <div className="text-rose-400 text-sm mb-2">
                        Pipeline failed.<br />
                        {pipelineResult.failed_step && (
                          <>
                            <span className="font-semibold">Failed step:</span> {pipelineResult.failed_step}<br />
                          </>
                        )}
                        {pipelineResult.script && (
                          <>
                            <span className="font-semibold">Script:</span> {pipelineResult.script}<br />
                          </>
                        )}
                        {pipelineResult.returncode !== undefined && (
                          <>
                            <span className="font-semibold">Return code:</span> {pipelineResult.returncode}<br />
                          </>
                        )}
                        {pipelineResult.stderr && (
                          <>
                            <span className="font-semibold">Error output:</span>
                            <pre className="bg-gray-900 text-rose-200 rounded p-2 mt-1 overflow-x-auto max-h-40">{pipelineResult.stderr}</pre>
                          </>
                        )}
                      </div>
                    )}
                    {/* Collapsible stdout/stderr */}
                    {(pipelineResult.stdout || pipelineResult.stderr) && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-slate-300 underline">Show pipeline output</summary>
                        {pipelineResult.stdout && (
                          <div className="mt-1">
                            <span className="font-semibold text-slate-400">stdout:</span>
                            <pre className="bg-gray-900 text-slate-200 rounded p-2 mt-1 overflow-x-auto max-h-40">{pipelineResult.stdout}</pre>
                          </div>
                        )}
                        {pipelineResult.stderr && (
                          <div className="mt-1">
                            <span className="font-semibold text-slate-400">stderr:</span>
                            <pre className="bg-gray-900 text-rose-200 rounded p-2 mt-1 overflow-x-auto max-h-40">{pipelineResult.stderr}</pre>
                          </div>
                        )}
                        {/* Show raw object for debugging if needed */}
                        {typeof pipelineResult === 'object' && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-slate-400 underline">Show raw result JSON</summary>
                            <pre className="bg-gray-900 text-slate-400 rounded p-2 mt-1 overflow-x-auto max-h-40">{JSON.stringify(pipelineResult, null, 2)}</pre>
                          </details>
                        )}
                      </details>
                    )}
                  </div>
                )}
                <div className="text-xs text-slate-400 mt-2">
                  <span className="font-semibold">Note:</span> Upload a new wildlife incident CSV to the raw data layer. After upload, click <span className="font-bold">Run Pipeline</span> to retrain the model and refresh analytics. Only .csv files are accepted.
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsandTrends;