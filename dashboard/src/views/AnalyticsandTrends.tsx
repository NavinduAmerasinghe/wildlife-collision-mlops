import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
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

/**
 * Normalize metric value to 0-1 range.
 * If value > 1, assume it's 0-100 and divide by 100.
 */
function normalizeMetric(value: number | undefined | null): number {
  if (value === null || value === undefined || isNaN(value)) return 0;
  if (value > 1) return value / 100;
  return value;
}

/**
 * Generate dynamic research interpretation bullets based on model metrics.
 */
function generateResearchInterpretation({
  rowCount,
  logistic,
  randomForest,
}: {
  rowCount: number | null | undefined;
  logistic: { accuracy?: number; precision?: number; recall?: number; f1_score?: number } | null | undefined;
  randomForest: { accuracy?: number; precision?: number; recall?: number; f1_score?: number } | null | undefined;
}): string[] {
  const notes: string[] = [];

  // Normalize metrics to 0-1 range
  const lrF1 = normalizeMetric(logistic?.f1_score);
  const rfF1 = normalizeMetric(randomForest?.f1_score);
  const lrAcc = normalizeMetric(logistic?.accuracy);
  const rfAcc = normalizeMetric(randomForest?.accuracy);
  const lrPrecision = normalizeMetric(logistic?.precision);
  const rfPrecision = normalizeMetric(randomForest?.precision);
  const lrRecall = normalizeMetric(logistic?.recall);
  const rfRecall = normalizeMetric(randomForest?.recall);

  const bestModel =
    rfF1 > lrF1 ? 'Random Forest' :
    lrF1 > rfF1 ? 'Logistic Regression' :
    'Both models';

  const bestF1 = Math.max(lrF1, rfF1);
  const bestAccuracy = Math.max(lrAcc, rfAcc);
  const bestPrecision = Math.max(lrPrecision, rfPrecision);
  const bestRecall = Math.max(lrRecall, rfRecall);

  // Rule 1: Check if F1 is near zero
  if (bestF1 <= 0.01) {
    notes.push('Both models show very weak risk detection performance because the F1-score is close to zero.');
  } else if (bestModel === 'Both models') {
    notes.push('Both models produced similar balanced performance in the current experiment.');
  } else {
    notes.push(`${bestModel} performed better based on F1-score, which balances precision and recall.`);
  }

  // Rule 2: Check for high accuracy but low recall/F1 (majority class bias)
  if (bestAccuracy >= 0.8 && bestRecall <= 0.1 && bestF1 <= 0.1) {
    notes.push('Although accuracy is high, the very low recall and F1-score suggest the model is mostly predicting the majority class, such as low-risk or safe cases.');
  }

  // Rule 3: Check recall
  if (bestRecall <= 0.1) {
    notes.push('Recall is very low, meaning the model is missing most actual wildlife risk cases.');
  } else if (bestRecall < 0.5) {
    notes.push('Recall is limited, so the model may still miss several real risk situations.');
  }

  // Rule 4: Check precision
  if (bestPrecision <= 0.1) {
    notes.push('Precision is very low, meaning risk predictions are not yet reliable.');
  } else if (bestPrecision < 0.5) {
    notes.push('Precision is moderate to low, so some predicted risk alerts may be unreliable.');
  }

  // Rule 5: Check dataset size
  if (rowCount && rowCount < 100) {
    notes.push('The dataset is small, so the current results should be treated only as prototype validation.');
  } else if (rowCount && rowCount < 1000) {
    notes.push('The dataset size is moderate, but more diverse data is needed for stronger generalization.');
  }

  // Rule 6: MLOps workflow status
  notes.push('The MLOps workflow is functioning because data upload, training, model comparison, and prediction outputs are being generated.');

  return notes;
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
  const [refreshLoading, setRefreshLoading] = useState(false);

  const refreshData = async () => {
    setRefreshLoading(true);
    setError(null);
    try {
      const [pipelineData, summaryData, comparisonData, uploadsResponse] = await Promise.all([
        apiClient.get(`/dashboard/pipeline-status`).then((r) => r.data),
        apiClient.get(`/dashboard/summary`).then((r) => r.data),
        apiClient.get(`/dashboard/model-comparison`).then((r) => r.data),
        apiClient.get(`/data/uploads/history`).then((r) => r.data),
      ]);
      setPipeline(pipelineData ?? null);
      setSummary(summaryData ?? null);
      setComparison(comparisonData ?? null);
      setUploadsData((uploadsResponse && uploadsResponse.uploads) || null);
    } catch {
      setError('Unable to refresh analytics data. Backend may be offline.');
    } finally {
      setRefreshLoading(false);
    }
  };

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
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">

        <header className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-100">MLOps Analytics & Model Insights</h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-4xl">Analyze pipeline health, dataset readiness, and trained model performance for wildlife collision risk prediction.</p>
          </div>
          <button
            onClick={refreshData}
            disabled={refreshLoading || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshLoading ? 'animate-spin' : ''}`} />
            {refreshLoading ? 'Refreshing…' : 'Refresh'}
          </button>
        </header>

        {loading ? (
          <div className="py-16 text-center text-slate-300 text-lg">Loading analytics…</div>
        ) : error ? (
          <div className="py-16 text-center text-rose-400 text-lg">{error}</div>
        ) : (
          <div className="space-y-4">
            {/* Section 1: Pipeline cards (full width) */}
            <section>
              <h2 className="text-lg font-semibold mb-3 text-slate-100">Pipeline Readiness Overview</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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
                    <div key={item.key} className={`rounded-xl p-3 text-center shadow ${theme === 'dark' ? cardDark : cardLight}`}>
                      <div className="font-semibold text-base mb-1 text-slate-100">{item.label}</div>
                      <div className={`text-sm font-bold ${color}`}>{label}</div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Section 2: Dataset & Feature Summary (grid of 4) */}
            <section>
              <h2 className="text-lg font-semibold mb-3 text-slate-100">Dataset & Feature Summary</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                <div className={`rounded-xl p-3 shadow ${theme === 'dark' ? cardDark : cardLight}`}>
                  <div className="text-xs text-slate-400">Latest Gold Batch ID</div>
                  <div className="text-sm font-semibold text-slate-100 mt-2 break-all">{summary?.latest_gold_batch_id ?? 'N/A'}</div>
                </div>
                <div className={`rounded-xl p-3 shadow ${theme === 'dark' ? cardDark : cardLight}`}>
                  <div className="text-xs text-slate-400">Gold Row Count</div>
                  <div className="text-sm font-semibold text-slate-100 mt-2">{summary?.latest_gold_row_count ?? 'N/A'}</div>
                </div>
                <div className={`rounded-xl p-3 shadow ${theme === 'dark' ? cardDark : cardLight}`}>
                  <div className="text-xs text-slate-400">Gold Created At</div>
                  <div className="text-sm font-semibold text-slate-100 mt-2">{summary?.latest_gold_created_at ? new Date(summary.latest_gold_created_at).toLocaleString() : 'N/A'}</div>
                </div>
                <div className={`rounded-xl p-3 shadow ${theme === 'dark' ? cardDark : cardLight}`}>
                  <div className="text-xs text-slate-400">Feature Count</div>
                  <div className="text-sm font-semibold text-slate-100 mt-2">{summary?.feature_count ?? 'N/A'}</div>
                </div>
                <div className={`rounded-2xl p-3 shadow ${theme === 'dark' ? cardDark : cardLight}`}>
                  <div className="text-xs text-slate-400">Selected Best Model</div>
                  <div className={`text-sm font-bold mt-2 ${summary?.selected_best_model ? 'text-emerald-400' : 'text-slate-100'}`}>{summary?.selected_best_model ?? 'N/A'}</div>
                </div>
              </div>
            </section>

            {/* Section 3: Two-column grid (left: comparison+interpretation, right: metrics chart) */}
            <section>
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                <div className="space-y-4 xl:col-span-7">
                  <div>
                    <h3 className="text-base font-semibold mb-2 text-slate-100">Model Performance Comparison</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {comparison ? (
                        [
                          { key: 'logistic_regression', label: 'Logistic Regression', metrics: comparison.logistic_regression },
                          { key: 'random_forest', label: 'Random Forest', metrics: comparison.random_forest },
                        ].map((model) => (
                          <div key={model.key} className={`rounded-2xl p-4 shadow flex flex-col gap-2 border-2 ${theme === 'dark' ? cardDark : cardLight} ${comparison.selected_best_model?.toLowerCase().includes(model.key.replace('_', ' ')) ? 'border-emerald-400' : 'border-transparent'}`}>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-base text-slate-100">{model.label}</span>
                              {comparison.selected_best_model?.toLowerCase().includes(model.key.replace('_', ' ')) && (
                                <span className="ml-2 px-2 py-0.5 rounded bg-emerald-700 text-emerald-100 text-xs font-bold">Best</span>
                              )}
                            </div>

                            {model.metrics ? (
                              <div className="grid grid-cols-2 gap-2 text-sm text-slate-200">
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
                    <h3 className="text-base font-semibold mb-2 text-slate-100">Research Interpretation</h3>
                    <div className={`rounded-2xl p-3 shadow ${theme === 'dark' ? cardDark : cardLight}`}>
                      {comparison && (comparison.logistic_regression || comparison.random_forest) ? (
                        <ul className="list-disc ml-5 space-y-1.5 text-sm text-slate-200">
                          {generateResearchInterpretation({
                            rowCount: summary?.latest_gold_row_count,
                            logistic: comparison.logistic_regression,
                            randomForest: comparison.random_forest,
                          }).map((note, idx) => (
                            <li key={idx}>{note}</li>
                          ))}
                        </ul>
                      ) : (
                        <ul className="list-disc ml-6 space-y-2 text-slate-400">
                          <li>Awaiting model training and comparison data.</li>
                          <li>Once the pipeline runs, research insights will be generated dynamically.</li>
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                <div className="xl:col-span-5">
                  <h3 className="text-base font-semibold mb-2 text-slate-100">Model Metrics Chart</h3>
                  <div className={`rounded-2xl p-3 shadow ${theme === 'dark' ? cardDark : cardLight}`}>
                    <ModelMetricsChart logisticRegression={comparison?.logistic_regression} randomForest={comparison?.random_forest} />
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: Two-column grid (left: uploads chart, right: upload & retraining) */}
            <section>
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                <div className="xl:col-span-7">
                  <h3 className="text-base font-semibold mb-2 text-slate-100">Dataset Upload History</h3>
                  <div className={`rounded-2xl p-3 shadow ${theme === 'dark' ? cardDark : cardLight}`}>
                    {uploadsData && uploadsData.length > 0 ? (
                      <DatasetUploadHistoryChart uploads={uploadsData} />
                    ) : (
                      <div className="flex items-center justify-center h-52 text-slate-400">No chart data available yet.</div>
                    )}
                  </div>
                </div>

                <div className="xl:col-span-5">
                  <h3 className="text-base font-semibold mb-2 text-slate-100">Dataset Upload & Retraining</h3>
                  <div className={`rounded-2xl p-3 shadow ${theme === 'dark' ? cardDark : cardLight}`}>
                    <form
                      className="flex flex-col md:flex-row items-center gap-3"
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
                              await refreshData();
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
