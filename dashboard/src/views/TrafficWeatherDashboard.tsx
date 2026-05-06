import React, { useEffect, useState } from "react";
import { Loader, CheckCircle, XCircle, Activity, Database, Brain, GitCompare, Zap, Layers } from "lucide-react";
import { PredictionHistoryChart } from "../components/PredictionHistoryChart";

const API_BASE = "http://127.0.0.1:8000";

type PipelineStatus = {
  bronze_available: boolean;
  silver_available: boolean;
  gold_available: boolean;
  model_available: boolean;
  comparison_available: boolean;
  api_status: boolean;
};

type Summary = {
  latest_gold_batch_id: string | null;
  latest_gold_row_count: number | null;
  latest_gold_created_at: string | null;
  feature_count: number | null;
  selected_best_model: string | null;
};

type ModelComparison = {
  batch_id: string | null;
  selected_best_model: string | null;
  logistic_regression: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1_score?: number;
  } | null;
  random_forest: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1_score?: number;
  } | null;
};

type PredictRequest = {
  temperature: number;
  precipitation: number;
  wind_speed: number;
  visibility: number;
  speed_limit: number;
  hour: number;
  month: number;
  is_night: number;
  is_weekend: number;
  high_precipitation: number;
};

type PredictResponse = {
  predicted_class: number;
  risk_label: string;
  probability: number | null;
};

type Prediction = {
  _id: string;
  response?: {
    risk_label: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

const defaultPredict: PredictRequest = {
  temperature: 5,
  precipitation: 2,
  wind_speed: 4,
  visibility: 10000,
  speed_limit: 80,
  hour: 22,
  month: 4,
  is_night: 1,
  is_weekend: 0,
  high_precipitation: 0,
};

const TrafficWeatherDashboard: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<boolean | null>(null);
  const [apiStatusLoading, setApiStatusLoading] = useState(true);
  const [apiStatusError, setApiStatusError] = useState<string | null>(null);

  const [pipeline, setPipeline] = useState<PipelineStatus | null>(null);
  const [pipelineLoading, setPipelineLoading] = useState(true);
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [comparison, setComparison] = useState<ModelComparison | null>(null);
  const [comparisonLoading, setComparisonLoading] = useState(true);
  const [comparisonError, setComparisonError] = useState<string | null>(null);

  const [predictForm, setPredictForm] = useState<PredictRequest>({ ...defaultPredict });
  const [predictResult, setPredictResult] = useState<PredictResponse | null>(null);
  const [predictLoading, setPredictLoading] = useState(false);
  const [predictError, setPredictError] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [scenarioExplanation, setScenarioExplanation] = useState<string>("");
  const [predictionsData, setPredictionsData] = useState<Prediction[] | null>(null);

  const scenarios: { key: string; label: string; emoji: string; payload: PredictRequest; explanation: string }[] = [
    {
      key: "safe_daytime",
      label: "Safe Daytime Driving",
      emoji: "☀️",
      payload: { temperature: 12, precipitation: 0, wind_speed: 2, visibility: 15000, speed_limit: 60, hour: 13, month: 6, is_night: 0, is_weekend: 0, high_precipitation: 0 },
      explanation: "Clear daytime conditions usually reduce collision risk.",
    },
    {
      key: "rainy_night",
      label: "Rainy Night Road",
      emoji: "🌧️",
      payload: { temperature: 4, precipitation: 8, wind_speed: 6, visibility: 3000, speed_limit: 80, hour: 23, month: 10, is_night: 1, is_weekend: 0, high_precipitation: 1 },
      explanation: "Nighttime and precipitation can increase uncertainty and wildlife collision risk.",
    },
    {
      key: "weekend_high_speed",
      label: "Weekend High-Speed Road",
      emoji: "🚗",
      payload: { temperature: 7, precipitation: 2, wind_speed: 4, visibility: 9000, speed_limit: 100, hour: 21, month: 5, is_night: 1, is_weekend: 1, high_precipitation: 0 },
      explanation: "Higher speed and night travel can increase the severity and likelihood of collisions.",
    },
    {
      key: "low_visibility_forest",
      label: "Low Visibility Forest Road",
      emoji: "🌲",
      payload: { temperature: -2, precipitation: 4, wind_speed: 5, visibility: 1200, speed_limit: 80, hour: 6, month: 11, is_night: 1, is_weekend: 0, high_precipitation: 1 },
      explanation: "Low visibility near forest-like conditions can make animal detection harder.",
    },
  ];

  const handleScenarioClick = async (scenario: typeof scenarios[0]) => {
    setSelectedScenario(scenario.key);
    setPredictForm(scenario.payload);
    setScenarioExplanation("");
    setPredictLoading(true);
    setPredictError(null);
    setPredictResult(null);
    try {
      const res = await fetch(`${API_BASE}/predict`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(scenario.payload) });
      if (!res.ok) throw new Error("Prediction failed");
      const data: PredictResponse = await res.json();
      setPredictResult(data);
      setScenarioExplanation(scenario.explanation);
    } catch (err: any) {
      setPredictError(err?.message || "Prediction failed");
    } finally {
      setPredictLoading(false);
    }
  };

  useEffect(() => {
    fetch(`${API_BASE}/health`).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(d => { setApiStatus(d.status === "ok"); setApiStatusError(null); }).catch(() => { setApiStatus(false); setApiStatusError("Could not connect to API"); }).finally(() => setApiStatusLoading(false));
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/dashboard/pipeline-status`).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(data => { setPipeline(data); setPipelineError(null); }).catch(() => setPipelineError("Could not load pipeline status")).finally(() => setPipelineLoading(false));
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/dashboard/summary`).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(data => { setSummary(data); setSummaryError(null); }).catch(() => setSummaryError("Could not load summary")).finally(() => setSummaryLoading(false));
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/dashboard/model-comparison`).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(data => { setComparison(data); setComparisonError(null); }).catch(() => setComparisonError("Could not load model comparison")).finally(() => setComparisonLoading(false));
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/predictions/history`).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(data => { setPredictionsData(data.predictions || null); }).catch(() => { /* silently fail for predictions history */ });
  }, []);
  const handlePredictChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPredictForm(prev => ({ ...prev, [name]: Number(value) }));
  };

  const handlePredictSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPredictLoading(true);
    setPredictError(null);
    setPredictResult(null);
    try {
      const res = await fetch(`${API_BASE}/predict`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(predictForm) });
      if (!res.ok) throw new Error("Prediction failed");
      const data: PredictResponse = await res.json();
      setPredictResult(data);
    } catch (err: any) {
      setPredictError(err?.message || "Prediction failed");
    } finally {
      setPredictLoading(false);
    }
  };

  const formatPercent = (value: number | null | undefined) =>
    typeof value === "number" ? `${Math.round(value * 100)}%` : "—";

  const pipelineItems = [
    { label: "Bronze Layer", key: "bronze_available" as keyof PipelineStatus, icon: <Layers className="w-5 h-5" /> },
    { label: "Silver Layer", key: "silver_available" as keyof PipelineStatus, icon: <Layers className="w-5 h-5" /> },
    { label: "Gold Layer", key: "gold_available" as keyof PipelineStatus, icon: <Layers className="w-5 h-5" /> },
    { label: "Model", key: "model_available" as keyof PipelineStatus, icon: <Brain className="w-5 h-5" /> },
    { label: "Comparison", key: "comparison_available" as keyof PipelineStatus, icon: <GitCompare className="w-5 h-5" /> },
    { label: "API", key: "api_status" as keyof PipelineStatus, icon: <Zap className="w-5 h-5" /> },
  ];

  const summaryItems = summary ? [
    { label: "Latest Gold Batch ID", value: summary.latest_gold_batch_id, icon: <Database className="w-4 h-4" /> },
    { label: "Latest Gold Row Count", value: summary.latest_gold_row_count, icon: <Activity className="w-4 h-4" /> },
    { label: "Latest Gold Created At", value: summary.latest_gold_created_at, icon: <Activity className="w-4 h-4" /> },
    { label: "Feature Count", value: summary.feature_count, icon: <Brain className="w-4 h-4" /> },
    { label: "Selected Best Model", value: summary.selected_best_model, icon: <Brain className="w-4 h-4" /> },
  ] : [];

  const getRiskColor = (label: string) => {
    const l = label?.toLowerCase();
    if (l?.includes("low")) return "text-emerald-400";
    if (l?.includes("medium") || l?.includes("moderate")) return "text-amber-400";
    if (l?.includes("high")) return "text-rose-400";
    return "text-slate-200";
  };

  const fieldLabels: Record<string, string> = {
    temperature: "Temperature (°C)",
    precipitation: "Precipitation (mm)",
    wind_speed: "Wind Speed (m/s)",
    visibility: "Visibility (m)",
    speed_limit: "Speed Limit (km/h)",
    hour: "Hour (0–23)",
    month: "Month (1–12)",
    is_night: "Is Night (0/1)",
    is_weekend: "Is Weekend (0/1)",
    high_precipitation: "High Precipitation (0/1)",
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0f1a] text-slate-100" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Top header bar */}
      <div className="border-b border-slate-800/60 bg-[#0d1525]/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              🦌 Wildlife Collision Risk Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">End-to-end MLOps · Finnish wildlife collision risk prediction</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-700 bg-slate-800/60 text-sm font-medium">
            <span className="text-slate-400">API Status</span>
            {apiStatusLoading ? (
              <Loader className="w-4 h-4 animate-spin text-slate-400" />
            ) : apiStatus ? (
              <><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /><span className="text-emerald-400">Connected</span></>
            ) : (
              <><span className="w-2 h-2 rounded-full bg-rose-400" /><span className="text-rose-400">Offline</span></>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* MLOps Pipeline Status */}
        <section>
          <SectionHeader title="MLOps Pipeline Status" />
          {pipelineLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : pipelineError ? (
            <ErrorBox message={pipelineError} />
          ) : pipeline ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {pipelineItems.map((item) => {
                const ok = pipeline[item.key] as boolean;
                return (
                  <div key={item.label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col items-center justify-center gap-2 min-h-[100px] text-center">
                    <div className={`${ok ? "text-emerald-400" : "text-slate-600"}`}>{item.icon}</div>
                    <span className="text-xs font-semibold text-slate-300 leading-tight">{item.label}</span>
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${ok ? "text-emerald-400" : "text-rose-400"}`}>
                      {ok ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {ok ? "Available" : "Missing"}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : null}
        </section>

        {/* Dataset Summary */}
        {/* <section>
          <SectionHeader title="Dataset Summary" />
          {summaryLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} tall />)}
            </div>
          ) : summaryError ? (
            <ErrorBox message={summaryError} />
          ) : summary ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {summaryItems.map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col gap-1">
                  <span className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {item.icon} {item.label}
                  </span>
                  <span className="text-base font-semibold text-slate-100 break-all mt-1">
                    {item.value === null || item.value === undefined ? <span className="text-slate-500">Not available</span> : String(item.value)}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </section> */}

        {/* Model Comparison */}
        {/* <section>
          <SectionHeader title="Model Comparison" />
          {comparisonLoading ? (
            <SkeletonCard tall />
          ) : comparisonError ? (
            <ErrorBox message={comparisonError} />
          ) : comparison ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mb-5 text-sm">
                <div><span className="text-slate-500">Batch ID:</span> <span className="text-slate-200 font-mono text-xs">{comparison.batch_id ?? "—"}</span></div>
                <div><span className="text-slate-500">Best Model:</span> <span className="text-emerald-400 font-semibold">{comparison.selected_best_model ?? "—"}</span></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: "Logistic Regression", color: "text-sky-400", borderColor: "border-sky-800/50 bg-sky-950/20", data: comparison.logistic_regression },
                  { title: "Random Forest", color: "text-emerald-400", borderColor: "border-emerald-800/50 bg-emerald-950/20", data: comparison.random_forest },
                ].map(({ title, color, borderColor, data }) => (
                  <div key={title} className={`rounded-xl border ${borderColor} p-4`}>
                    <div className={`font-semibold ${color} mb-3 text-sm`}>{title}</div>
                    {data ? (
                      <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                        {[
                          { label: "Accuracy", value: data.accuracy },
                          { label: "Precision", value: data.precision },
                          { label: "Recall", value: data.recall },
                          { label: "F1 Score", value: data.f1_score },
                        ].map((m) => (
                          <div key={m.label} className="flex justify-between items-center">
                            <span className="text-xs text-slate-400">{m.label}</span>
                            <span className="text-sm font-mono font-bold text-slate-100">{formatPercent(m.value)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">Metrics not available yet</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section> */}

        {/* Real-World Risk Scenario Simulator */}
        <section>
          <SectionHeader title="Real-World Risk Scenario Simulator" subtitle="Click a scenario to simulate and predict" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {scenarios.map((scenario) => {
              const isSelected = selectedScenario === scenario.key;
              const isLoading = predictLoading && isSelected;
              return (
                <button
                  key={scenario.key}
                  type="button"
                  onClick={() => handleScenarioClick(scenario)}
                  disabled={predictLoading}
                  className={[
                    "rounded-xl border p-5 text-left transition-all duration-200 flex flex-col gap-3",
                    isSelected
                      ? "border-emerald-500/70 bg-emerald-950/30 ring-1 ring-emerald-500/40"
                      : "border-slate-800 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-800/80",
                    isLoading ? "opacity-60 cursor-wait" : "cursor-pointer",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{scenario.emoji}</span>
                    {isLoading && <Loader className="w-4 h-4 animate-spin text-emerald-400" />}
                  </div>
                  <div className="font-semibold text-sm text-slate-100">{scenario.label}</div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-400">
                    <span>🌡 {scenario.payload.temperature}°C</span>
                    <span>🌧 {scenario.payload.precipitation}mm</span>
                    <span>💨 {scenario.payload.wind_speed}m/s</span>
                    <span>👁 {scenario.payload.visibility}m</span>
                    <span>🚦 {scenario.payload.speed_limit}km/h</span>
                    <span>🕐 {scenario.payload.hour}:00</span>
                    <span>📅 Month {scenario.payload.month}</span>
                    <span>{scenario.payload.is_night ? "🌙 Night" : "☀️ Day"}</span>
                  </div>
                  <div className="text-xs text-slate-500 border-t border-slate-800 pt-2">Click to simulate</div>
                </button>
              );
            })}
          </div>
          {scenarioExplanation && (
            <div className="mt-4 px-4 py-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-sm text-center">
              {scenarioExplanation}
            </div>
          )}
        </section>

        {/* Wildlife Risk Prediction Form */}
        <section>
          <SectionHeader title="Wildlife Risk Prediction" subtitle="Manually configure parameters and run prediction" />
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <form onSubmit={handlePredictSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
                {Object.entries(defaultPredict).map(([key]) => (
                  <div key={key} className="flex flex-col gap-1.5">
                    <label htmlFor={key} className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {fieldLabels[key] ?? key.replace(/_/g, " ")}
                    </label>
                    <input
                      id={key}
                      name={key}
                      type="number"
                      value={predictForm[key as keyof PredictRequest]}
                      onChange={handlePredictChange}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-colors"
                      step="any"
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={predictLoading}
                  className="px-8 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {predictLoading ? <><Loader className="w-4 h-4 animate-spin" /> Predicting…</> : "Run Prediction"}
                </button>
              </div>
            </form>

            {predictError && (
              <div className="mt-4 px-4 py-3 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-400 text-sm text-center">
                {predictError}
              </div>
            )}

            {predictResult && (
              <div className="mt-6 pt-5 border-t border-slate-800">
                <div className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Prediction Result</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-xl bg-slate-800/60 border border-slate-700 p-4 text-center">
                    <div className="text-xs text-slate-500 mb-1">Risk Label</div>
                    <div className={`text-xl font-bold ${getRiskColor(predictResult.risk_label)}`}>{predictResult.risk_label}</div>
                  </div>
                  <div className="rounded-xl bg-slate-800/60 border border-slate-700 p-4 text-center">
                    <div className="text-xs text-slate-500 mb-1">Predicted Class</div>
                    <div className="text-xl font-bold text-slate-100">{predictResult.predicted_class}</div>
                  </div>
                  <div className="rounded-xl bg-slate-800/60 border border-slate-700 p-4 text-center">
                    <div className="text-xs text-slate-500 mb-1">Probability</div>
                    <div className="text-xl font-bold text-slate-100">
                      {predictResult.probability !== null ? formatPercent(predictResult.probability) : "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Prediction History Chart */}
        {predictionsData && predictionsData.length > 0 && (
          <section>
            <SectionHeader title="Prediction History Chart" subtitle="Distribution of recent predictions by risk level" />
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <PredictionHistoryChart predictions={predictionsData} />
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

// — Sub-components —

const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="mb-4">
    <h2 className="text-lg font-bold text-slate-100">{title}</h2>
    {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
  </div>
);

const SkeletonCard: React.FC<{ tall?: boolean }> = ({ tall }) => (
  <div className={`rounded-xl border border-slate-800 bg-slate-900/40 animate-pulse ${tall ? "min-h-[80px]" : "min-h-[100px]"}`} />
);

const ErrorBox: React.FC<{ message: string }> = ({ message }) => (
  <div className="px-4 py-3 rounded-xl border border-rose-900/50 bg-rose-950/20 text-rose-400 text-sm">{message}</div>
);

export default TrafficWeatherDashboard;