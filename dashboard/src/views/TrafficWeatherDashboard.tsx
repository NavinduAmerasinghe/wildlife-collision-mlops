import React, { useEffect, useState } from "react";
import { Loader, CheckCircle, XCircle, Activity, Database, Brain, GitCompare, Zap, Layers } from "lucide-react";
import { PredictionHistoryChart } from "../components/PredictionHistoryChart";
import apiClient from "../utils/apiClient";

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
  model_version?: string;
  response?: {
    predicted_class?: number;
    risk_label: string;
    probability?: number | null;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type RiskScenario = {
  key: string;
  title: string;
  description: string;
  conditions: string[];
  payload: PredictRequest;
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

const riskScenarios: RiskScenario[] = [
  {
    key: "autumn_moose_migration",
    title: "Autumn Moose Migration — Rural Forest Road",
    description: "Higher wildlife movement during autumn dusk and night conditions near forest roads.",
    conditions: ["Autumn migration season", "Forest edge road", "Dusk / night travel"],
    payload: {
      temperature: 4,
      precipitation: 2,
      wind_speed: 4,
      visibility: 2500,
      speed_limit: 80,
      hour: 20,
      month: 10,
      is_night: 1,
      is_weekend: 0,
      high_precipitation: 0,
    },
  },
  {
    key: "winter_low_visibility_highway",
    title: "Winter Low Visibility Highway",
    description: "Snowfall, darkness, and reduced visibility increase driving risk on faster roads.",
    conditions: ["Snow or slush", "Darkness", "High-speed road"],
    payload: {
      temperature: -7,
      precipitation: 7,
      wind_speed: 8,
      visibility: 1800,
      speed_limit: 100,
      hour: 18,
      month: 1,
      is_night: 1,
      is_weekend: 0,
      high_precipitation: 1,
    },
  },
  {
    key: "forest_dawn",
    title: "Forest Road at Dawn",
    description: "Early morning wildlife movement near forest roads can raise the chance of sudden animal crossings.",
    conditions: ["Early morning", "Forest road", "Low dawn light"],
    payload: {
      temperature: 2,
      precipitation: 0,
      wind_speed: 3,
      visibility: 4500,
      speed_limit: 70,
      hour: 5,
      month: 5,
      is_night: 1,
      is_weekend: 0,
      high_precipitation: 0,
    },
  },
  {
    key: "rainy_night_rural",
    title: "Rainy Night Rural Road",
    description: "Wet roads and darkness reduce reaction time on lower-traffic rural routes.",
    conditions: ["Rainfall", "Night driving", "Rural road"],
    payload: {
      temperature: 6,
      precipitation: 9,
      wind_speed: 6,
      visibility: 3200,
      speed_limit: 80,
      hour: 23,
      month: 9,
      is_night: 1,
      is_weekend: 1,
      high_precipitation: 1,
    },
  },
];

function normalizeProbability(probability: number | null | undefined): number | null {
  if (probability === null || probability === undefined || Number.isNaN(probability)) return null;
  return probability > 1 ? probability / 100 : probability;
}

function formatProbability(probability: number | null | undefined): string {
  const normalized = normalizeProbability(probability);
  if (normalized === null) return "—";
  return `${Math.round(normalized * 100)}%`;
}

function getRiskLevel(probability: number | null | undefined) {
  const normalized = normalizeProbability(probability);

  if (normalized === null) {
    return { level: "Unknown", tone: "text-slate-300", badge: "bg-slate-700/60 text-slate-200" };
  }

  if (normalized < 0.2) {
    return { level: "Low", tone: "text-emerald-400", badge: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" };
  }

  if (normalized < 0.5) {
    return { level: "Moderate", tone: "text-amber-400", badge: "bg-amber-500/15 text-amber-300 border border-amber-500/30" };
  }

  if (normalized < 0.75) {
    return { level: "High", tone: "text-rose-400", badge: "bg-rose-500/15 text-rose-300 border border-rose-500/30" };
  }

  return { level: "Critical", tone: "text-red-300", badge: "bg-red-500/15 text-red-200 border border-red-500/30" };
}

function getRiskRecommendations(riskLevel: string): string[] {
  const level = riskLevel.toLowerCase();

  if (level === "low") {
    return ["Continue normal driving", "Stay alert near forest edges"];
  }

  if (level === "moderate") {
    return ["Reduce speed slightly", "Increase roadside awareness", "Watch for wildlife warning signs"];
  }

  if (level === "high") {
    return ["Reduce speed significantly", "Avoid sudden braking", "Keep safe distance", "Be alert near wildlife crossings"];
  }

  if (level === "critical") {
    return ["Strongly reduce speed", "Consider avoiding route if possible", "Use extra caution", "Monitor road edges continuously"];
  }

  return ["Review road conditions carefully", "Use driver judgment before proceeding"];
}

function getRiskFactors(inputPayload: PredictRequest): string[] {
  const factors: string[] = [];

  if (inputPayload.is_night === 1 || inputPayload.hour >= 19 || inputPayload.hour <= 6) {
    factors.push("Nighttime driving increases wildlife collision risk.");
  }

  if (inputPayload.visibility <= 5000) {
    factors.push("Low visibility reduces driver reaction time.");
  }

  if (inputPayload.high_precipitation === 1 || inputPayload.precipitation >= 5) {
    factors.push("High precipitation may reduce road safety.");
  }

  if (inputPayload.speed_limit >= 80) {
    factors.push("Higher speed limit increases collision severity.");
  }

  if ([1, 2, 9, 10, 11, 12].includes(inputPayload.month)) {
    factors.push("Autumn and winter months may increase wildlife-related road risk.");
  }

  if (inputPayload.wind_speed >= 8) {
    factors.push("Stronger wind can make driving conditions less stable.");
  }

  if (factors.length === 0) {
    factors.push("Current conditions appear less elevated, but wildlife risk never disappears completely.");
  }

  return factors;
}

function getScenarioExplanation(selectedScenario: RiskScenario | null) {
  if (!selectedScenario) return "";
  return `${selectedScenario.description} Conditions: ${selectedScenario.conditions.join(" • ")}`;
}

function getAssessmentExplanation(riskLevel: string, factors: string[]): string {
  const primaryFactor = factors[0];

  if (riskLevel === "Low") {
    return primaryFactor
      ? `Current inputs point to a lower collision likelihood. ${primaryFactor}`
      : "Current inputs point to a lower collision likelihood, but drivers should still remain alert near forest edges.";
  }

  if (riskLevel === "Moderate") {
    return primaryFactor
      ? `The assessment suggests a moderate collision risk. ${primaryFactor}`
      : "The assessment suggests a moderate collision risk, so extra caution is warranted.";
  }

  if (riskLevel === "High") {
    return primaryFactor
      ? `The assessment indicates a high collision risk. ${primaryFactor}`
      : "The assessment indicates a high collision risk and the route should be treated with caution.";
  }

  if (riskLevel === "Critical") {
    return primaryFactor
      ? `The assessment indicates critical collision risk. ${primaryFactor}`
      : "The assessment indicates critical collision risk and the route deserves immediate caution.";
  }

  return "The current assessment is based on the deployed ML model and the simulation inputs.";
}

const TrafficWeatherDashboard: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<boolean | null>(null);
  const [apiStatusLoading, setApiStatusLoading] = useState(true);
  const [apiStatusError, setApiStatusError] = useState<string | null>(null);

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

  const loadPredictionHistory = async () => {
    try {
      const res = await apiClient.get(`/predictions/history`);
      setPredictionsData(res.data.predictions || null);
    } catch {
      // keep history optional
    }
  };

  const handleScenarioClick = (scenario: RiskScenario) => {
    setSelectedScenario(scenario.key);
    setPredictForm(scenario.payload);
    setScenarioExplanation(getScenarioExplanation(scenario));
    setPredictError(null);
    setPredictResult(null);
  };

  useEffect(() => {
    apiClient.get(`/health`).then(d => { setApiStatus(d.data.status === "ok"); setApiStatusError(null); }).catch(() => { setApiStatus(false); setApiStatusError("Could not connect to API"); }).finally(() => setApiStatusLoading(false));
  }, []);

  useEffect(() => {
    apiClient.get(`/dashboard/summary`).then(r => { setSummary(r.data); setSummaryError(null); }).catch(() => setSummaryError("Could not load summary")).finally(() => setSummaryLoading(false));
  }, []);

  useEffect(() => {
    apiClient.get(`/dashboard/model-comparison`).then(r => { setComparison(r.data); setComparisonError(null); }).catch(() => setComparisonError("Could not load model comparison")).finally(() => setComparisonLoading(false));
  }, []);

  useEffect(() => {
    loadPredictionHistory();
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
      const res = await apiClient.post(`/predict`, predictForm);
      const data: PredictResponse = res.data;
      setPredictResult(data);
      await loadPredictionHistory();
    } catch (err: any) {
      setPredictError(err?.message || "Prediction failed");
    } finally {
      setPredictLoading(false);
    }
  };

  const formatPercent = (value: number | null | undefined) =>
    typeof value === "number" ? `${Math.round(value * 100)}%` : "—";

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

  const latestPrediction = predictionsData && predictionsData.length > 0 ? predictionsData[0] : null;
  const latestModelVersion = latestPrediction?.model_version ?? "Not available";
  const selectedRiskScenario = riskScenarios.find((scenario) => scenario.key === selectedScenario) ?? null;
  const assessedRisk = getRiskLevel(predictResult?.probability);
  const riskRecommendations = getRiskRecommendations(assessedRisk.level);
  const riskFactors = getRiskFactors(predictForm);
  const riskAssessmentExplanation = predictResult ? getAssessmentExplanation(assessedRisk.level, riskFactors) : "";

  return (
    <div className="min-h-screen w-full bg-[#0a0f1a] text-slate-100" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Top header bar */}
      <div className="border-b border-slate-800/60 bg-[#0d1525]/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
             Wildlife Collision Risk Dashboard
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

      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-8 flex-1 overflow-y-auto">

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

        {/* Environmental Risk Analysis Scenarios */}
        <section>
          <SectionHeader title="Environmental Risk Analysis Scenarios" subtitle="Choose a realistic Finnish road setting to preload the risk assessment inputs" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {riskScenarios.map((scenario) => {
              const isSelected = selectedScenario === scenario.key;
              return (
                <button
                  key={scenario.key}
                  type="button"
                  onClick={() => handleScenarioClick(scenario)}
                  disabled={predictLoading}
                  className={[
                    "rounded-xl border p-5 text-left transition-all duration-200 flex flex-col gap-3",
                    isSelected
                      ? "border-emerald-500/70 bg-emerald-950/25 ring-1 ring-emerald-500/40"
                      : "border-slate-800 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-800/80",
                    predictLoading ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
                  ].join(" ")}
                  aria-pressed={isSelected}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-sm text-slate-100 leading-snug">{scenario.title}</div>
                      <div className="mt-1 text-xs text-slate-400 leading-relaxed">{scenario.description}</div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${isSelected ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                      {isSelected ? 'Loaded' : 'Load'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
                    {scenario.conditions.map((condition) => (
                      <span key={condition} className="rounded-full border border-slate-700 bg-slate-800/70 px-2.5 py-1">{condition}</span>
                    ))}
                  </div>
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
                  <div className="text-xs text-slate-500 border-t border-slate-800 pt-2">Loads values into Advanced Simulation Inputs</div>
                </button>
              );
            })}
          </div>
          {scenarioExplanation && (
            <div className="mt-4 px-4 py-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-200 text-sm">
              <span className="font-semibold text-emerald-300">Why this scenario matters:</span> {scenarioExplanation}
            </div>
          )}
        </section>

        {/* Wildlife Collision Risk Assessment */}
        <section>
          <SectionHeader title="Wildlife Collision Risk Assessment" subtitle="Advanced simulation inputs for research, testing, and operational decision support" />
          <div className="grid grid-cols-1 2xl:grid-cols-[1.05fr_0.95fr_0.9fr] gap-5">
            {/* Left: Form */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <span>Latest deployed model version: <span className="font-semibold text-slate-200">{latestModelVersion}</span></span>
                {selectedRiskScenario && <span>Scenario loaded: <span className="font-semibold text-slate-200">{selectedRiskScenario.title}</span></span>}
              </div>
              <form onSubmit={handlePredictSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-5">
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
                    {predictLoading ? <><Loader className="w-4 h-4 animate-spin" /> Assessing…</> : "Run Risk Assessment"}
                  </button>
                </div>
              </form>

              {predictError && (
                <div className="mt-4 px-4 py-3 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-400 text-sm text-center">
                  {predictError}
                </div>
              )}
            </div>

            {/* Right: Result / Recommendation card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Risk Assessment Result</div>
                <div className="text-xs text-slate-500">Model version: <span className="font-semibold text-slate-300">{latestModelVersion}</span></div>
              </div>
              {predictResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                    <div className="rounded-xl bg-slate-800/60 border border-slate-700 p-4 text-center">
                      <div className="text-xs text-slate-500 mb-1">Risk Level</div>
                      <div className={`text-xl font-bold ${assessedRisk.tone}`}>{assessedRisk.level}</div>
                    </div>
                    <div className="rounded-xl bg-slate-800/60 border border-slate-700 p-4 text-center">
                      <div className="text-xs text-slate-500 mb-1">Probability</div>
                      <div className="text-xl font-bold text-slate-100">{formatProbability(predictResult.probability)}</div>
                    </div>
                    <div className="rounded-xl bg-slate-800/60 border border-slate-700 p-4 text-center">
                      <div className="text-xs text-slate-500 mb-1">Model Output</div>
                      <div className={`text-lg font-bold ${getRiskColor(predictResult.risk_label)}`}>{predictResult.risk_label}</div>
                      <div className="text-xs text-slate-400 mt-1">Predicted class {predictResult.predicted_class}</div>
                    </div>
                    <div className="rounded-xl bg-slate-800/60 border border-slate-700 p-4 text-center">
                      <div className="text-xs text-slate-500 mb-1">Model Version</div>
                      <div className="text-base font-bold text-slate-100 break-all">{latestModelVersion}</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Plain-language explanation</div>
                    <p className="text-sm text-slate-200 leading-relaxed">{riskAssessmentExplanation}</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Recommended driver actions</div>
                      <ul className="space-y-1 text-sm text-slate-200 list-disc ml-5">
                        {riskRecommendations.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Main risk factors</div>
                      <ul className="space-y-1 text-sm text-slate-200 list-disc ml-5">
                        {riskFactors.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="text-sm text-slate-500">Load a scenario or enter advanced inputs, then run a risk assessment to see the decision-support output here.</div>
              )}
            </div>
            {predictionsData && predictionsData.length > 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                <SectionHeader title="Risk Assessment History Chart" subtitle="Distribution of recent assessments by risk level" />
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 h-[520px]">
                  <PredictionHistoryChart predictions={predictionsData} />
                </div>
              </div>
            )}
          </div>
        </section>

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
  <div className={`rounded-xl border border-slate-800 bg-slate-900/40 animate-pulse ${tall ? "min-h-20" : "min-h-24"}`} />
);

const ErrorBox: React.FC<{ message: string }> = ({ message }) => (
  <div className="px-4 py-3 rounded-xl border border-rose-900/50 bg-rose-950/20 text-rose-400 text-sm">{message}</div>
);

export default TrafficWeatherDashboard;