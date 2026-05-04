import React, { useEffect, useState } from "react";
import { Loader, CheckCircle, XCircle } from "lucide-react";

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

const cardClass =
  "rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg p-6 flex flex-col items-center justify-center min-h-[90px]";

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

  // Scenario definitions
  const scenarios: { key: string; label: string; payload: PredictRequest; explanation: string }[] = [
    {
      key: "safe_daytime",
      label: "Safe Daytime Driving",
      payload: {
        temperature: 12,
        precipitation: 0,
        wind_speed: 2,
        visibility: 15000,
        speed_limit: 60,
        hour: 13,
        month: 6,
        is_night: 0,
        is_weekend: 0,
        high_precipitation: 0,
      },
      explanation: "Clear daytime conditions usually reduce collision risk.",
    },
    {
      key: "rainy_night",
      label: "Rainy Night Road",
      payload: {
        temperature: 4,
        precipitation: 8,
        wind_speed: 6,
        visibility: 3000,
        speed_limit: 80,
        hour: 23,
        month: 10,
        is_night: 1,
        is_weekend: 0,
        high_precipitation: 1,
      },
      explanation: "Nighttime and precipitation can increase uncertainty and wildlife collision risk.",
    },
    {
      key: "weekend_high_speed",
      label: "Weekend High-Speed Road",
      payload: {
        temperature: 7,
        precipitation: 2,
        wind_speed: 4,
        visibility: 9000,
        speed_limit: 100,
        hour: 21,
        month: 5,
        is_night: 1,
        is_weekend: 1,
        high_precipitation: 0,
      },
      explanation: "Higher speed and night travel can increase the severity and likelihood of collisions.",
    },
    {
      key: "low_visibility_forest",
      label: "Low Visibility Forest Road",
      payload: {
        temperature: -2,
        precipitation: 4,
        wind_speed: 5,
        visibility: 1200,
        speed_limit: 80,
        hour: 6,
        month: 11,
        is_night: 1,
        is_weekend: 0,
        high_precipitation: 1,
      },
      explanation: "Low visibility near forest-like conditions can make animal detection harder.",
    },
  ];

  // Scenario click handler
  const handleScenarioClick = async (scenario: typeof scenarios[0]) => {
    setSelectedScenario(scenario.key);
    setPredictForm(scenario.payload);
    setScenarioExplanation("");
    setPredictLoading(true);
    setPredictError(null);
    setPredictResult(null);
    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scenario.payload),
      });
      if (!res.ok) throw new Error("Prediction failed");
      const data: PredictResponse = await res.json();
      setPredictResult(data);
      setScenarioExplanation(scenario.explanation);
    } catch (err: any) {
      setPredictError(err?.message || "Prediction failed");
      setScenarioExplanation("");
    } finally {
      setPredictLoading(false);
    }
  };

  useEffect(() => {
    setApiStatusLoading(true);

    fetch(`${API_BASE}/health`)
      .then((r) => {
        if (!r.ok) throw new Error("Could not connect to API");
        return r.json();
      })
      .then((d) => {
        setApiStatus(d.status === "ok");
        setApiStatusError(null);
      })
      .catch(() => {
        setApiStatus(false);
        setApiStatusError("Could not connect to API");
      })
      .finally(() => setApiStatusLoading(false));
  }, []);

  useEffect(() => {
    setPipelineLoading(true);

    fetch(`${API_BASE}/dashboard/pipeline-status`)
      .then((r) => {
        if (!r.ok) throw new Error("Could not load pipeline status");
        return r.json();
      })
      .then((data) => {
        setPipeline(data);
        setPipelineError(null);
      })
      .catch(() => setPipelineError("Could not load pipeline status"))
      .finally(() => setPipelineLoading(false));
  }, []);

  useEffect(() => {
    setSummaryLoading(true);

    fetch(`${API_BASE}/dashboard/summary`)
      .then((r) => {
        if (!r.ok) throw new Error("Could not load summary");
        return r.json();
      })
      .then((data) => {
        setSummary(data);
        setSummaryError(null);
      })
      .catch(() => setSummaryError("Could not load summary"))
      .finally(() => setSummaryLoading(false));
  }, []);

  useEffect(() => {
    setComparisonLoading(true);

    fetch(`${API_BASE}/dashboard/model-comparison`)
      .then((r) => {
        if (!r.ok) throw new Error("Could not load model comparison");
        return r.json();
      })
      .then((data) => {
        setComparison(data);
        setComparisonError(null);
      })
      .catch(() => setComparisonError("Could not load model comparison"))
      .finally(() => setComparisonLoading(false));
  }, []);

  const handlePredictChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setPredictForm((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  const handlePredictSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setPredictLoading(true);
    setPredictError(null);
    setPredictResult(null);

    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(predictForm),
      });

      if (!res.ok) {
        throw new Error("Prediction failed");
      }

      const data: PredictResponse = await res.json();
      setPredictResult(data);
    } catch (err: any) {
      setPredictError(err?.message || "Prediction failed");
    } finally {
      setPredictLoading(false);
    }
  };

  const statusIcon = (ok: boolean) =>
    ok ? (
      <CheckCircle className="w-6 h-6 text-emerald-400" />
    ) : (
      <XCircle className="w-6 h-6 text-rose-400" />
    );

  const statusText = (ok: boolean) => (ok ? "Available" : "Missing");

  const formatPercent = (value: number | null | undefined) =>
    typeof value === "number" ? `${Math.round(value * 100)}%` : "-";

  return (
    <div className="min-h-screen w-full px-4 py-6 sm:px-6 lg:px-10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <h1 className="text-4xl font-bold mb-2 text-slate-200">
        Wildlife Collision Risk Dashboard
      </h1>

      <div className="text-lg text-slate-400 mb-8">
        End-to-end MLOps dashboard for Finnish wildlife collision risk
        prediction.
      </div>

      <div className="mb-8">
        <div className={`${cardClass} max-w-xs mx-auto flex-row gap-3`}>
          <span className="font-semibold text-lg">API Status:</span>

          {apiStatusLoading ? (
            <Loader className="w-5 h-5 animate-spin text-slate-400" />
          ) : apiStatusError ? (
            <span className="text-rose-400">{apiStatusError}</span>
          ) : apiStatus ? (
            <span className="flex items-center gap-2 text-emerald-400 font-semibold">
              {statusIcon(true)} Connected
            </span>
          ) : (
            <span className="flex items-center gap-2 text-rose-400 font-semibold">
              {statusIcon(false)} Offline
            </span>
          )}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          MLOps Pipeline Status
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {pipelineLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`${cardClass} animate-pulse`} />
            ))
          ) : pipelineError ? (
            <div className="col-span-6 text-rose-400">{pipelineError}</div>
          ) : pipeline ? (
            [
              { label: "Bronze Layer", value: pipeline.bronze_available },
              { label: "Silver Layer", value: pipeline.silver_available },
              { label: "Gold Layer", value: pipeline.gold_available },
              { label: "Model", value: pipeline.model_available },
              {
                label: "Comparison",
                value: pipeline.comparison_available,
              },
              { label: "API", value: pipeline.api_status },
            ].map((item) => (
              <div key={item.label} className={cardClass}>
                <span className="font-semibold mb-2 text-center">
                  {item.label}
                </span>

                <span className="mt-2 flex items-center gap-2 text-lg">
                  {statusIcon(item.value)}
                  {statusText(item.value)}
                </span>
              </div>
            ))
          ) : null}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Dataset Summary</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summaryLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`${cardClass} animate-pulse`} />
            ))
          ) : summaryError ? (
            <div className="col-span-3 text-rose-400">{summaryError}</div>
          ) : summary ? (
            [
              {
                label: "Latest Gold Batch ID",
                value: summary.latest_gold_batch_id,
              },
              {
                label: "Latest Gold Row Count",
                value: summary.latest_gold_row_count,
              },
              {
                label: "Latest Gold Created At",
                value: summary.latest_gold_created_at,
              },
              {
                label: "Feature Count",
                value: summary.feature_count,
              },
              {
                label: "Selected Best Model",
                value: summary.selected_best_model,
              },
            ].map((item) => (
              <div key={item.label} className={cardClass}>
                <span className="font-semibold mb-2 text-center">
                  {item.label}
                </span>

                <span className="mt-2 text-lg text-center break-all">
                  {item.value === null || item.value === undefined
                    ? "Not available"
                    : item.value}
                </span>
              </div>
            ))
          ) : null}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Model Comparison</h2>

        <div className={`${cardClass} w-full max-w-3xl mx-auto`}>
          {comparisonLoading ? (
            <Loader className="w-6 h-6 animate-spin text-slate-400" />
          ) : comparisonError ? (
            <span className="text-rose-400">{comparisonError}</span>
          ) : comparison ? (
            <div className="w-full">
              <div className="flex flex-wrap gap-4 mb-4">
                <div>
                  <span className="font-semibold">Batch ID:</span>{" "}
                  {comparison.batch_id ?? "Not available"}
                </div>

                <div>
                  <span className="font-semibold">Selected Best Model:</span>{" "}
                  {comparison.selected_best_model ?? "Not available"}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-700 rounded-xl p-4">
                  <span className="font-semibold text-sky-300">
                    Logistic Regression
                  </span>

                  <div className="mt-2 text-sm grid grid-cols-2 gap-2">
                    {comparison.logistic_regression ? (
                      [
                        {
                          label: "Accuracy",
                          value: comparison.logistic_regression.accuracy,
                        },
                        {
                          label: "Precision",
                          value: comparison.logistic_regression.precision,
                        },
                        {
                          label: "Recall",
                          value: comparison.logistic_regression.recall,
                        },
                        {
                          label: "F1 Score",
                          value: comparison.logistic_regression.f1_score,
                        },
                      ].map((m) => (
                        <div key={m.label} className="flex justify-between">
                          <span>{m.label}:</span>
                          <span className="font-mono">
                            {formatPercent(m.value)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="col-span-2 text-slate-400">
                        Metrics not available yet
                      </span>
                    )}
                  </div>
                </div>

                <div className="border border-slate-700 rounded-xl p-4">
                  <span className="font-semibold text-emerald-300">
                    Random Forest
                  </span>

                  <div className="mt-2 text-sm grid grid-cols-2 gap-2">
                    {comparison.random_forest ? (
                      [
                        {
                          label: "Accuracy",
                          value: comparison.random_forest.accuracy,
                        },
                        {
                          label: "Precision",
                          value: comparison.random_forest.precision,
                        },
                        {
                          label: "Recall",
                          value: comparison.random_forest.recall,
                        },
                        {
                          label: "F1 Score",
                          value: comparison.random_forest.f1_score,
                        },
                      ].map((m) => (
                        <div key={m.label} className="flex justify-between">
                          <span>{m.label}:</span>
                          <span className="font-mono">
                            {formatPercent(m.value)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="col-span-2 text-slate-400">
                        Metrics not available yet
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>


      {/* Real-World Risk Scenario Simulator */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Real-World Risk Scenario Simulator</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {scenarios.map((scenario) => (
            <button
              key={scenario.key}
              type="button"
              onClick={() => handleScenarioClick(scenario)}
              className={
                cardClass +
                (selectedScenario === scenario.key
                  ? " border-emerald-400 ring-2 ring-emerald-400 shadow-emerald-500/20 "
                  : " hover:border-emerald-300 hover:bg-slate-900/90 ") +
                (predictLoading && selectedScenario === scenario.key ? " opacity-60" : "")
              }
              disabled={predictLoading}
            >
              <span className="font-semibold text-lg mb-2 block">{scenario.label}</span>
              <ul className="text-xs text-slate-300 mb-2">
                <li>Temp: {scenario.payload.temperature}°C</li>
                <li>Precip: {scenario.payload.precipitation} mm</li>
                <li>Wind: {scenario.payload.wind_speed} m/s</li>
                <li>Visib: {scenario.payload.visibility} m</li>
                <li>Speed: {scenario.payload.speed_limit} km/h</li>
                <li>Hour: {scenario.payload.hour}</li>
                <li>Month: {scenario.payload.month}</li>
                <li>Night: {scenario.payload.is_night ? "Yes" : "No"}</li>
                <li>Weekend: {scenario.payload.is_weekend ? "Yes" : "No"}</li>
                <li>High Precip: {scenario.payload.high_precipitation ? "Yes" : "No"}</li>
              </ul>
              <span className="text-xs text-slate-400">Click to simulate</span>
            </button>
          ))}
        </div>
        {scenarioExplanation && (
          <div className="mb-4 text-center text-emerald-300 text-base font-medium">
            {scenarioExplanation}
          </div>
        )}
      </div>

      {/* Wildlife Risk Prediction Form */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Wildlife Risk Prediction</h2>
        <form
          onSubmit={handlePredictSubmit}
          className={`${cardClass} max-w-2xl mx-auto w-full`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {Object.entries(defaultPredict).map(([key]) => (
              <div key={key} className="flex flex-col gap-1">
                <label htmlFor={key} className="text-sm font-medium capitalize">
                  {key.replace(/_/g, " ")}
                </label>
                <input
                  id={key}
                  name={key}
                  type="number"
                  value={predictForm[key as keyof PredictRequest]}
                  onChange={handlePredictChange}
                  className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                  step="any"
                />
              </div>
            ))}
          </div>
          <button
            type="submit"
            className="mt-6 px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg disabled:opacity-60"
            disabled={predictLoading}
          >
            {predictLoading ? (
              <Loader className="w-5 h-5 animate-spin inline-block" />
            ) : (
              "Predict"
            )}
          </button>
          {predictError && (
            <div className="mt-3 text-rose-400">{predictError}</div>
          )}
          {predictResult && (
            <div className="mt-6 border-t border-slate-700 pt-4">
              <div className="text-lg font-semibold mb-2">Prediction Result</div>
              <div className="flex flex-wrap gap-6">
                <div>
                  <span className="font-semibold">Risk Label:</span> {predictResult.risk_label}
                </div>
                <div>
                  <span className="font-semibold">Predicted Class:</span> {predictResult.predicted_class}
                </div>
                <div>
                  <span className="font-semibold">Probability:</span> {predictResult.probability !== null ? formatPercent(predictResult.probability) : "N/A"}
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default TrafficWeatherDashboard;