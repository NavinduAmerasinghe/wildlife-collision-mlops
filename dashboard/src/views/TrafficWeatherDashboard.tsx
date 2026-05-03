
import React, { useEffect, useState } from "react";
import { Loader, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

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
  logistic_regression: any;
  random_forest: any;
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
  // API status
  const [apiStatus, setApiStatus] = useState<null | boolean>(null);
  const [apiStatusLoading, setApiStatusLoading] = useState(true);
  const [apiStatusError, setApiStatusError] = useState<string | null>(null);

  // Pipeline status
  const [pipeline, setPipeline] = useState<PipelineStatus | null>(null);
  const [pipelineLoading, setPipelineLoading] = useState(true);
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  // Summary
  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Model comparison
  const [comparison, setComparison] = useState<ModelComparison | null>(null);
  const [comparisonLoading, setComparisonLoading] = useState(true);
  const [comparisonError, setComparisonError] = useState<string | null>(null);

  // Prediction form
  const [predictForm, setPredictForm] = useState<PredictRequest>({ ...defaultPredict });
  const [predictResult, setPredictResult] = useState<PredictResponse | null>(null);
  const [predictLoading, setPredictLoading] = useState(false);
  const [predictError, setPredictError] = useState<string | null>(null);

  // Fetch API status
  useEffect(() => {
    setApiStatusLoading(true);
    fetch(`${API_BASE}/health`)
      .then((r) => r.json())
      .then((d) => setApiStatus(d.status === "ok"))
      .catch(() => setApiStatusError("Could not connect to API"))
      .finally(() => setApiStatusLoading(false));
  }, []);

  // Fetch pipeline status
  useEffect(() => {
    setPipelineLoading(true);
    fetch(`${API_BASE}/dashboard/pipeline-status`)
      .then((r) => r.json())
      .then(setPipeline)
      .catch(() => setPipelineError("Could not load pipeline status"))
      .finally(() => setPipelineLoading(false));
  }, []);

  // Fetch summary
  useEffect(() => {
    setSummaryLoading(true);
    fetch(`${API_BASE}/dashboard/summary`)
      .then((r) => r.json())
      .then(setSummary)
      .catch(() => setSummaryError("Could not load summary"))
      .finally(() => setSummaryLoading(false));
  }, []);

  // Fetch model comparison
  useEffect(() => {
    setComparisonLoading(true);
    fetch(`${API_BASE}/dashboard/model-comparison`)
      .then((r) => r.json())
      .then(setComparison)
      .catch(() => setComparisonError("Could not load model comparison"))
      .finally(() => setComparisonLoading(false));
  }, []);

  // Prediction form handlers
  const handlePredictChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setPredictForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(predictForm),
      });
      if (!res.ok) throw new Error("Prediction failed");
      const data = await res.json();
      setPredictResult(data);
    } catch (err: any) {
      setPredictError(err?.message || "Prediction failed");
    } finally {
      setPredictLoading(false);
    }
  };

  // UI helpers
  const statusIcon = (ok: boolean) =>
    ok ? <CheckCircle className="w-6 h-6 text-emerald-400" /> : <XCircle className="w-6 h-6 text-rose-400" />;

  return (
    <div className="min-h-screen w-full px-4 py-6 sm:px-6 lg:px-10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <h1 className="text-4xl font-bold mb-8 text-slate-200">Wildlife Collision Risk Dashboard</h1>

      {/* API Status */}
      <div className="mb-8">
        <div className={cardClass + " max-w-xs mx-auto flex-row flex gap-3 justify-start"}>
          <span className="font-semibold text-lg">API Status:</span>
          {apiStatusLoading ? (
            <Loader className="w-5 h-5 animate-spin text-slate-400" />
          ) : apiStatusError ? (
            <span className="text-rose-400">{apiStatusError}</span>
          ) : apiStatus ? (
            <span className="flex items-center gap-2 text-emerald-400 font-semibold">{statusIcon(true)} Connected</span>
          ) : (
            <span className="flex items-center gap-2 text-rose-400 font-semibold">{statusIcon(false)} Disconnected</span>
          )}
        </div>
      </div>

      {/* Pipeline Status */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">MLOps Pipeline Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {pipelineLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={cardClass + " animate-pulse"} />
            ))
          ) : pipelineError ? (
            <div className="col-span-5 text-rose-400">{pipelineError}</div>
          ) : pipeline ? (
            [
              { label: "Bronze Layer", value: pipeline.bronze_available },
              { label: "Silver Layer", value: pipeline.silver_available },
              { label: "Gold Layer", value: pipeline.gold_available },
              { label: "Model", value: pipeline.model_available },
              { label: "Model Comparison", value: pipeline.comparison_available },
            ].map((item) => (
              <div key={item.label} className={cardClass}>
                <span className="font-semibold mb-2">{item.label}</span>
                <span className="mt-2 flex items-center gap-2 text-lg">
                  {statusIcon(item.value)}
                  {item.value ? "Available" : "Missing"}
                </span>
              </div>
            ))
          ) : null}
        </div>
      </div>

      {/* Dataset Summary */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Dataset Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summaryLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={cardClass + " animate-pulse"} />
            ))
          ) : summaryError ? (
            <div className="col-span-3 text-rose-400">{summaryError}</div>
          ) : summary ? (
            [
              { label: "Latest Gold Batch ID", value: summary.latest_gold_batch_id },
              { label: "Latest Gold Row Count", value: summary.latest_gold_row_count },
              { label: "Latest Gold Created At", value: summary.latest_gold_created_at },
              { label: "Feature Count", value: summary.feature_count ?? "Not available" },
              { label: "Selected Best Model", value: summary.selected_best_model },
            ].map((item) => (
              <div key={item.label} className={cardClass}>
                <span className="font-semibold mb-2">{item.label}</span>
                <span className="mt-2 text-lg">
                  {item.value === null ? "Not available" : item.value}
                </span>
              </div>
            ))
          ) : null}
        </div>
      </div>

      {/* Model Comparison */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Model Comparison</h2>
        <div className={cardClass + " w-full max-w-2xl mx-auto"}>
          {comparisonLoading ? (
            <Loader className="w-6 h-6 animate-spin text-slate-400" />
          ) : comparisonError ? (
            <span className="text-rose-400">{comparisonError}</span>
          ) : comparison ? (
            <div className="w-full">
              <div className="flex flex-wrap gap-4 mb-2">
                <div>
                  <span className="font-semibold">Batch ID:</span> {comparison.batch_id ?? "Not available"}
                </div>
                <div>
                  <span className="font-semibold">Selected Best Model:</span> {comparison.selected_best_model ?? "Not available"}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="border border-slate-700 rounded-xl p-4">
                  <span className="font-semibold text-sky-300">Logistic Regression</span>
                  <div className="mt-2 text-sm">
                    {comparison.logistic_regression ? (
                      <pre className="whitespace-pre-wrap break-all text-slate-200 bg-slate-900/80 p-2 rounded-md">
                        {JSON.stringify(comparison.logistic_regression, null, 2)}
                      </pre>
                    ) : (
                      <span className="text-slate-400">Metrics not available yet</span>
                    )}
                  </div>
                </div>
                <div className="border border-slate-700 rounded-xl p-4">
                  <span className="font-semibold text-emerald-300">Random Forest</span>
                  <div className="mt-2 text-sm">
                    {comparison.random_forest ? (
                      <pre className="whitespace-pre-wrap break-all text-slate-200 bg-slate-900/80 p-2 rounded-md">
                        {JSON.stringify(comparison.random_forest, null, 2)}
                      </pre>
                    ) : (
                      <span className="text-slate-400">Metrics not available yet</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Wildlife Risk Prediction Form */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Wildlife Risk Prediction</h2>
        <form onSubmit={handlePredictSubmit} className={cardClass + " max-w-2xl mx-auto w-full"}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {Object.entries(defaultPredict).map(([key, def]) => (
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
            {predictLoading ? <Loader className="w-5 h-5 animate-spin inline-block" /> : "Predict"}
          </button>
          {predictError && <div className="mt-3 text-rose-400">{predictError}</div>}
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
                  <span className="font-semibold">Probability:</span> {predictResult.probability !== null ? predictResult.probability.toFixed(3) : "N/A"}
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

  type NotificationChannelKey = "push" | "toast" | "email";

  type NotificationHandler = (
    message: string,
    showToast: (msg: string, type?: ToastType) => void
  ) => Promise<void>;

  const notificationStrategies: Record<NotificationChannelKey, NotificationHandler> = {
    push: async (message, showToast) => {
      if (typeof window === "undefined" || !("Notification" in window)) {
        showToast(message, "info");
        return;
      }

      if (Notification.permission === "granted") {
        new Notification("Live camera updated", { body: message });
      } else {
        showToast(
          "Browser has blocked or not granted push notifications. Showing message in the dashboard instead.",
          "warning"
        );
        showToast(message, "success");
      }
    },

    toast: async (message, showToast) => {
      showToast(message, "success");
    },

    email: async (message, showToast) => {
      try {
        const res = await fetch("http://localhost:8080/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient: "an.cao@tuni.fi",
            subject: "Smart Road Weather Dashboard notification",
            body: message,
          }),
        });

        if (!res.ok) throw new Error(`Email API error: ${res.status}`);

        showToast("Notification sent via email.", "success");
      } catch (err) {
        console.error("Error sending email notification", err);
        showToast("Could not send email notification. Check the email service.", "warning");
      }
    },
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchFmiAlertsForRegion = async (regionName: string): Promise<Alert[]> => {
    try {
      const response = await fetch("https://alerts.fmi.fi/cap/feed/atom_en-GB.xml");
      if (!response.ok) throw new Error("Failed to fetch FMI alerts");

      const text = await response.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "application/xml");

      const entries = Array.from(xml.getElementsByTagName("entry"));
      const regionAlerts: Alert[] = [];
      const allAlerts: Alert[] = [];

      const regionLower = regionName.toLowerCase();

      for (const entry of entries) {
        const contentNode = entry.getElementsByTagName("content")[0];
        if (!contentNode) continue;

        const alertNode =
          contentNode.getElementsByTagName("alert")[0] ||
          contentNode.getElementsByTagName("cap:alert")[0];
        if (!alertNode) continue;

        const infoNodes = alertNode.getElementsByTagName("info");
        if (!infoNodes || infoNodes.length === 0) continue;

        let chosenInfo: Element | null = null;

        for (const info of Array.from(infoNodes)) {
          const langNode = info.getElementsByTagName("language")[0];
          const lang = langNode?.textContent?.trim();
          if (lang === "en-GB") {
            chosenInfo = info;
            break;
          }
        }

        if (!chosenInfo) chosenInfo = infoNodes[0];
        if (!chosenInfo) continue;

        const severityText = chosenInfo.getElementsByTagName("severity")[0]?.textContent?.trim() || "";
        const eventText = chosenInfo.getElementsByTagName("event")[0]?.textContent?.trim() || "";
        const headlineText = chosenInfo.getElementsByTagName("headline")[0]?.textContent?.trim() || "";
        const descriptionText =
          chosenInfo.getElementsByTagName("description")[0]?.textContent?.trim() || "";

        let eventCode: string | undefined;

        const parameterNodes = chosenInfo.getElementsByTagName("parameter");
        for (const param of Array.from(parameterNodes)) {
          const valueName = param.getElementsByTagName("valueName")[0]?.textContent || "";
          const value = param.getElementsByTagName("value")[0]?.textContent || "";
          if (valueName === "eventCode") {
            eventCode = value;
            break;
          }
        }

        const areaNodes = chosenInfo.getElementsByTagName("area");
        let coversRegion = false;

        for (const area of Array.from(areaNodes)) {
          const areaDescNode = area.getElementsByTagName("areaDesc")[0];
          const areaDesc = (areaDescNode?.textContent || "").trim();
          if (!areaDesc) continue;

          if (areaDesc.toLowerCase().includes(regionLower)) {
            coversRegion = true;
          }
        }

        let color: "red" | "yellow" | "green" = "yellow";
        const sevLower = severityText.toLowerCase();

        if (sevLower === "extreme" || sevLower === "severe") color = "red";
        else if (sevLower === "minor") color = "green";

        const pieces: string[] = [];
        if (eventText) pieces.push(eventText);
        if (headlineText && headlineText !== eventText) pieces.push(headlineText);
        if (descriptionText) pieces.push(descriptionText);

        const fullText = pieces.join(" – ");
        const trimmedText = fullText.length > 300 ? fullText.slice(0, 297) + "..." : fullText;

        const alertObj: Alert = {
          color,
          text: trimmedText || `Weather warning (${regionName})`,
          severity: severityText || "unknown",
          eventCode,
          eventName: eventText || headlineText || "Weather warning",
        };

        allAlerts.push(alertObj);
        if (coversRegion) regionAlerts.push(alertObj);
      }

      return regionAlerts.length > 0 ? regionAlerts : allAlerts;
    } catch (err) {
      console.error("Error fetching/parsing FMI alerts:", err);
      return [];
    }
  };

  const fetchFmiPointForecast = async (lat: number, lon: number): Promise<FmiPointData | null> => {
    try {
      const snap = (n: number) => Math.round(n / 0.025) * 0.025;

      const url =
        `https://opendata.fmi.fi/wfs?` +
        `service=WFS&version=2.0.0&request=GetFeature&` +
        `storedquery_id=fmi::forecast::meps::surface::point::simple&` +
        `latlon=${snap(lat)},${snap(lon)}&` +
        `parameters=temperature,windspeedms,WeatherSymbol3`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch FMI point forecast");

      const text = await response.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "application/xml");

      const exception = xml.getElementsByTagName("ows:ExceptionText")[0];
      if (exception) return null;

      const elements = Array.from(xml.getElementsByTagName("BsWfs:BsWfsElement"));

      if (elements.length === 0) return null;

      let latestTemperature: number | undefined;
      let latestWindSpeed: number | undefined;
      let latestPhenomenonCode: string | undefined;
      let latestTime: string | undefined;

      for (const el of elements) {
        const nameNode =
          el.getElementsByTagName("BsWfs:ParameterName")[0] ||
          el.getElementsByTagName("ParameterName")[0];
        const valueNode =
          el.getElementsByTagName("BsWfs:ParameterValue")[0] ||
          el.getElementsByTagName("ParameterValue")[0];
        const timeNode =
          el.getElementsByTagName("BsWfs:Time")[0] || el.getElementsByTagName("Time")[0];

        const paramName = nameNode?.textContent || "";
        const paramValue = valueNode?.textContent || "";
        const time = timeNode?.textContent || "";

        if (!paramName || !paramValue) continue;

        if (paramName === "temperature") {
          latestTemperature = parseFloat(paramValue);
          latestTime = time;
        } else if (paramName === "windspeedms") {
          latestWindSpeed = parseFloat(paramValue);
          latestTime = time;
        } else if (paramName === "WeatherSymbol3") {
          latestPhenomenonCode = paramValue;
          latestTime = time;
        }
      }

      return {
        temperature: latestTemperature,
        windSpeed: latestWindSpeed,
        phenomenonCode: latestPhenomenonCode,
        timestamp: latestTime,
      };
    } catch (err) {
      console.error("Error fetching/parsing FMI MEPS point forecast:", err);
      return null;
    }
  };

  const fetchNearestWeatherStation = async (lat: number, lon: number, regionName?: string) => {
    try {
      const stationsResponse = await fetch("https://tie.digitraffic.fi/api/weather/v1/stations", {
        headers: {
          "Digitraffic-User": "TrafficWeatherDashboard/1.0",
          "Accept-Encoding": "gzip",
        },
      });

      if (!stationsResponse.ok) throw new Error("Failed to fetch weather stations");

      const stationsData = await stationsResponse.json();

      let nearestStation: RoadWeatherStation | null = null;
      let minDistance = Infinity;

      stationsData.features.forEach((feature: any) => {
        const stationLat = feature.geometry.coordinates[1];
        const stationLon = feature.geometry.coordinates[0];
        const distance = calculateDistance(lat, lon, stationLat, stationLon);

        if (distance < minDistance) {
          minDistance = distance;
          nearestStation = {
            id: String(feature.id),
            name: feature.properties.name || feature.properties?.names?.fi || "Unknown",
            lat: stationLat,
            lon: stationLon,
          };
        }
      });

      if (nearestStation) {
        const weatherResponse = await fetch(
          `https://tie.digitraffic.fi/api/weather/v1/stations/${nearestStation.id}/data`,
          {
            headers: {
              "Digitraffic-User": "TrafficWeatherDashboard/1.0",
              "Accept-Encoding": "gzip",
            },
          }
        );

        if (weatherResponse.ok) {
          const weatherData = await weatherResponse.json();

          const sensorData: Record<string, number> = {};
          if (weatherData.sensorValues) {
            weatherData.sensorValues.forEach((sensor: any) => {
              if (typeof sensor.sensorValue === "number") {
                sensorData[sensor.name] = sensor.sensorValue;
              }
            });
          }

          const stationWithWeather: RoadWeatherStation = {
            ...nearestStation,
            roadTemperature: sensorData["TIE_1"] ?? sensorData["ILMA"],
            airTemperature: sensorData["ILMA"],
            windSpeed: sensorData["TUULI"] ?? sensorData["KESKITUULI"],
            humidity: sensorData["KOSTEUS"],
            precipitation: sensorData["SADEMAARA_1H"],
            visibility: sensorData["NÄKYVYYS"],
          };

          setNearestWeatherStation(stationWithWeather);

          const region =
            regionName || getFinnishRegionForCoordinates(stationWithWeather.lat, stationWithWeather.lon);

          setSelectedRegion(region || null);

          if (region) {
            const fmiAlerts = await fetchFmiAlertsForRegion(region);
            setAlerts(fmiAlerts);
            setSelectedAlertType("all");
          } else {
            setAlerts([]);
          }

          const pointData = await fetchFmiPointForecast(stationWithWeather.lat, stationWithWeather.lon);
          setFmiPointData(pointData);
        }
      }
    } catch (err) {
      console.error("Error fetching weather station data:", err);
    }
  };

  const fetchCameraStations = async () => {
    try {
      const response = await fetch("https://tie.digitraffic.fi/api/weathercam/v1/stations", {
        headers: {
          "Digitraffic-User": "TrafficWeatherDashboard/1.0",
          "Accept-Encoding": "gzip",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch camera stations");

      const data = await response.json();

      const stations: CameraStation[] = data.features
        .filter((feature: any) => feature.properties.presets && feature.properties.presets.length > 0)
        .map((feature: any) => ({
          id: String(feature.id),
          name: feature.properties.name || feature.properties.names?.fi || "Unknown",
          lat: feature.geometry.coordinates[1],
          lon: feature.geometry.coordinates[0],
          presets: feature.properties.presets.map((preset: any) => ({
            id: String(preset.id),
            presentationName: preset.presentationName || "Camera View",
            imageUrl: `https://weathercam.digitraffic.fi/${preset.id}.jpg`,
            stationId: String(feature.id),
          })),
        }))
        .slice(0, 200);

      setCameraStations(stations);

      const allPresets: CameraPreset[] = [];
      stations.forEach((station) => {
        station.presets.forEach((preset) => {
          allPresets.push({
            ...preset,
            presentationName: `${station.name} - ${preset.presentationName}`,
          });
        });
      });

      setCameraPresets(allPresets);

      if (allPresets.length > 0) {
        setSelectedCamera(allPresets[0].id);
      }
    } catch (err) {
      console.error("Error fetching camera stations:", err);
    }
  };

  const loadCameraImage = async (cameraId: string) => {
    if (!cameraId) return;

    setCameraLoading(true);
    try {
      const imageUrl = `https://weathercam.digitraffic.fi/${cameraId}.jpg?t=${Date.now()}`;
      setCurrentCameraImage(imageUrl);
      setLastImageUpdate(new Date());
    } catch (err) {
      console.error("Error loading camera image:", err);
    } finally {
      setCameraLoading(false);
    }
  };

  const getWeatherCondition = (code: number): string => {
    if (code === 0) return "Clear";
    if (code <= 3) return "Partly Cloudy";
    if (code <= 48) return "Foggy";
    if (code <= 67) return "Rainy";
    if (code <= 77) return "Snowy";
    if (code <= 82) return "Rain Showers";
    return "Stormy";
  };

  const getWeatherIcon = (code: number): string => {
    if (code === 0) return "sun";
    if (code <= 3) return "cloud";
    if (code <= 67) return "rain";
    if (code <= 77) return "snow";
    return "wind";
  };

  const fetchWeatherData = async (_location: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=61.4978&longitude=23.7610&current=temperature_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&timezone=auto&forecast_days=1"
      );

      if (!response.ok) throw new Error("Failed to fetch weather data");

      const data = await response.json();

      setCurrentTempC(data.current.temperature_2m);

      const currentHour = new Date().getHours();
      const forecastData: WeatherData[] = [];

      for (let i = 0; i < 4; i++) {
        const hourIndex = currentHour + i;
        if (hourIndex < data.hourly.temperature_2m.length) {
          const tempC = Math.round(data.hourly.temperature_2m[hourIndex]);
          const weatherCode = data.hourly.weather_code[hourIndex];
          const time = new Date(data.hourly.time[hourIndex]);

          forecastData.push({
            temp: `${tempC}°C`,
            tempValue: tempC,
            time: time.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
            condition: getWeatherCondition(weatherCode),
            icon: getWeatherIcon(weatherCode),
          });
        }
      }

      setWeatherData(forecastData);
    } catch (err) {
      setError("Unable to fetch weather data");
      console.error(err);
      setWeatherData([
        { temp: "18°C", time: "12:00", condition: "Clear", icon: "sun", tempValue: 18 },
        { temp: "18°C", time: "13:00", condition: "Clear", icon: "sun", tempValue: 18 },
        { temp: "19°C", time: "14:00", condition: "Clear", icon: "sun", tempValue: 19 },
        { temp: "19°C", time: "15:00", condition: "Clear", icon: "sun", tempValue: 19 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderWeatherIcon = (iconType: string) => {
    switch (iconType) {
      case "sun":
        return <Sun className="w-8 h-8 text-amber-300" />;
      case "cloud":
        return <Cloud className="w-8 h-8 text-slate-300" />;
      case "rain":
        return <CloudRain className="w-8 h-8 text-sky-300" />;
      case "snow":
        return <CloudSnow className="w-8 h-8 text-cyan-200" />;
      case "wind":
        return <Wind className="w-8 h-8 text-slate-300" />;
      default:
        return <Sun className="w-8 h-8 text-amber-300" />;
    }
  };

  const handleLocationSearch = () => {
    fetchWeatherData(searchLocation);
    showToast(`Location search applied using "${searchLocation || "N/A"}".`, "info");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleLocationSearch();
  };

  const handleCameraReloadClick = async () => {
    if (!selectedCamera) return;

    await loadCameraImage(selectedCamera);

    const station = cameraStations.find((s: CameraStation) =>
      s.presets.some((p) => p.id === selectedCamera)
    );

    if (station) {
      const regionFromCamera = getFinnishRegionForCoordinates(station.lat, station.lon);
      await fetchNearestWeatherStation(station.lat, station.lon, regionFromCamera || undefined);
    }

    showToast("Live camera image refreshed.", "success");
  };

  const getDetectedCondition = (): "Icy" | "Snowy" | "Wet" | "Clear" | null => {
    if (!nearestWeatherStation && !fmiPointData) return null;

    const roadTemp = nearestWeatherStation?.roadTemperature;
    const precip = nearestWeatherStation?.precipitation;
    const phenomenonCode = fmiPointData?.phenomenonCode
      ? parseInt(fmiPointData.phenomenonCode, 10)
      : undefined;

    if (roadTemp !== undefined && roadTemp <= 0) {
      if (phenomenonCode && phenomenonCode >= 70 && phenomenonCode <= 82) return "Snowy";
      return "Icy";
    }

    if (precip !== undefined && precip > 0) {
      if (phenomenonCode && phenomenonCode >= 70 && phenomenonCode <= 82) return "Snowy";
      return "Wet";
    }

    return "Clear";
  };

  const alertMatchesCondition = (
    alert: Alert,
    cond: "Icy" | "Clear" | "Wet" | "Snowy"
  ): boolean => {
    if (cond === "Clear") return true;

    const text = ((alert.text || "") + " " + (alert.eventName || "")).toLowerCase();

    if (cond === "Icy") {
      return text.includes("ice") || text.includes("icy") || text.includes("slippery") || text.includes("freezing");
    }

    if (cond === "Snowy") {
      return text.includes("snow") || text.includes("blizzard") || text.includes("snowfall") || text.includes("snowstorm");
    }

    if (cond === "Wet") {
      return text.includes("rain") || text.includes("shower") || text.includes("thunderstorm") || text.includes("flood") || text.includes("wet");
    }

    return true;
  };

  const getFilteredCameraPresets = (): CameraPreset[] => {
    const locTerm = searchLocation.trim().toLowerCase();

    const filtered = cameraPresets.filter((preset: CameraPreset) => {
      const text = preset.presentationName.toLowerCase();
      const station = cameraStations.find((s: CameraStation) => s.id === preset.stationId);
      const stationType = station ? classifyRoadType(station.name) : "Local Roads";

      const matchesRoadType = stationType === roadType;
      const matchesLocation = locTerm === "" ? true : text.includes(locTerm);

      return matchesRoadType && matchesLocation;
    });

    return [...filtered].sort((a, b) => {
      if (cameraSort === "name") return a.presentationName.localeCompare(b.presentationName);
      return a.id.localeCompare(b.id);
    });
  };

  const filteredCameraPresets = getFilteredCameraPresets();
  const detectedCondition = getDetectedCondition();
  const noCamerasMatchFilters = cameraPresets.length > 0 && filteredCameraPresets.length === 0;

  useEffect(() => {
    fetchWeatherData(searchLocation);
    fetchCameraStations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedCamera && cameraStations.length > 0) {
      loadCameraImage(selectedCamera);

      const station = cameraStations.find((s: CameraStation) =>
        s.presets.some((p) => p.id === selectedCamera)
      );

      if (station) {
        setSelectedCameraLocation({ lat: station.lat, lon: station.lon });

        const regionFromCamera = getFinnishRegionForCoordinates(station.lat, station.lon);
        setSelectedRegion(regionFromCamera || null);

        fetchNearestWeatherStation(station.lat, station.lon, regionFromCamera || undefined);
      }

      const interval = setInterval(() => {
        loadCameraImage(selectedCamera);
      }, 60000);

      return () => clearInterval(interval);
    }

    setNearestWeatherStation(null);
    setSelectedCameraLocation(null);
    setSelectedRegion(null);
    setAlerts([]);
    setFmiPointData(null);
    setSelectedAlertType("all");
    setCurrentCameraImage("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCamera, cameraStations]);

  useEffect(() => {
    const filtered = getFilteredCameraPresets();

    if (filtered.length === 0) {
      if (selectedCamera !== "") setSelectedCamera("");

      if (cameraPresets.length > 0) {
        showToast(
          "No cameras match the current filters. Try another road type or clear the search fields.",
          "warning"
        );
      }
    } else if (!filtered.some((p) => p.id === selectedCamera)) {
      setSelectedCamera(filtered[0].id);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchLocation, cameraPresets, roadType, cameraSort]);

  useEffect(() => {
    if (!detectedCondition) return;

    if (lastDetectedCondition !== detectedCondition) {
      if (lastDetectedCondition) {
        const message = `Detected road condition near ${
          nearestWeatherStation?.name || "the selected camera"
        } updated: ${detectedCondition}.`;

        const key: NotificationChannelKey =
          notificationType === "push" ? "push" : notificationType === "email" ? "email" : "toast";

        notificationStrategies[key](message, showToast);
      }

      setLastDetectedCondition(detectedCondition);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedCondition]);

  const alertTypeOptions = Array.from(
    new Map(
      alerts.map((a: Alert) => {
        const value = a.eventCode || a.eventName || "other";
        const label = a.eventName || a.eventCode || "Other";
        return [value, label];
      })
    ).entries()
  );

  const alertsFilteredByType = alerts.filter((alert: Alert) => {
    if (selectedAlertType === "all") return true;
    const value = alert.eventCode || alert.eventName;
    return value === selectedAlertType;
  });

  const alertsFilteredByTypeAndCondition = alertsFilteredByType.filter((alert: Alert) =>
    alertMatchesCondition(alert, conditions as "Icy" | "Clear" | "Wet" | "Snowy")
  );

  const alertsToShow =
    alertsFilteredByTypeAndCondition.length > 0
      ? alertsFilteredByTypeAndCondition
      : alertsFilteredByType.length > 0
      ? alertsFilteredByType
      : alerts;

  const defaultAlert: Alert = {
    color: "green",
    severity: "info",
    eventName: "No active FMI warnings",
    text: "There are currently no active FMI weather warnings for this region. Normal caution is still advised while driving.",
  };

  const displayAlerts = alertsToShow.length > 0 ? alertsToShow : [defaultAlert];

  const baselineTempLabel = currentTempC !== null ? formatTemp(currentTempC) : "";

  const notificationModeLabel =
    notificationType === "push"
      ? "Push On (browser + in-dashboard)"
      : notificationType === "email"
      ? "Email On (email + in-dashboard)"
      : "Push Off (in-dashboard only)";

  const notificationBadgeLabel =
    notificationType === "push" ? "Push: ON" : notificationType === "email" ? "Email: ON" : "Push: OFF";

  const notificationBadgeClasses =
    notificationType === "push"
      ? "bg-emerald-500/10 border-emerald-400 text-emerald-300"
      : notificationType === "email"
      ? "bg-sky-500/10 border-sky-400 text-sky-300"
      : "bg-slate-800 border-slate-600 text-slate-300";

  return (
    <div
      className={`h-full w-full px-4 py-6 sm:px-6 lg:px-10 overflow-y-auto ${
        theme === "dark"
          ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
          : "bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300"
      }`}
    >
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border shadow-lg text-sm ${
            toast.type === "success"
              ? "bg-emerald-600/90 border-emerald-400 text-white"
              : toast.type === "warning"
              ? "bg-amber-500/90 border-amber-300 text-slate-950"
              : "bg-slate-800/95 border-slate-600 text-slate-50"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="w-full space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl text-slate-400 mt-1">
              Smart Road Weather & Traffic Pred Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Live road cameras, road weather, and official FMI warnings for Finnish regions.
            </p>
          </div>

          {selectedRegion && (
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900/70 border border-slate-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-300">
                Focusing on region:{" "}
                <span className="font-semibold text-slate-100">{selectedRegion}</span>
              </span>
            </div>
          )}
        </div>

        {!locationEnabled ? (
          <div className="mt-6 max-w-3xl mx-auto border border-slate-700 rounded-2xl bg-slate-900/80 p-8 text-center">
            <h2 className="text-xl font-semibold text-slate-50 mb-3">Location is turned off</h2>
            <p className="text-sm text-slate-300 mb-4">
              To use the dashboard with live camera context and region-based warnings, turn Location ON in Settings.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-50 flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 rounded-full bg-sky-500/10 items-center justify-center">
                    <Wind className="h-4 w-4 text-sky-400" />
                  </span>
                  Live Traffic & Road Conditions
                  <InfoTooltip text="Search by location, pick a road type and set the expected road condition." />
                </h2>

                {baselineTempLabel && (
                  <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    Tampere baseline: <span className="font-semibold">{baselineTempLabel}</span>
                  </span>
                )}
              </div>

              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search location..."
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                  />
                  <span className="absolute right-3 top-2.5 text-[11px] text-slate-500">
                    Press Enter
                  </span>
                </div>
              </div>

              <div className="mb-4 border border-slate-800 rounded-2xl p-4 bg-slate-900/70">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-slate-100 flex items-center gap-1">
                    Live Camera
                    <InfoTooltip text="The live image appears when a camera is available for your selected road type and filters." />
                  </h3>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {roadType}
                    </span>

                    <span className={"text-[10px] px-2 py-0.5 rounded-full border " + notificationBadgeClasses}>
                      {notificationBadgeLabel}
                    </span>

                    <button
                      type="button"
                      onClick={handleCameraReloadClick}
                      className="text-[11px] px-3 py-1 rounded-full bg-slate-800 border border-slate-600 text-slate-100 hover:bg-slate-700 hover:border-sky-500 flex items-center gap-1 transition"
                      disabled={!selectedCamera || cameraLoading}
                    >
                      {cameraLoading && <Loader className="w-3 h-3 animate-spin text-slate-200" />}
                      <span>Reload</span>
                    </button>
                  </div>
                </div>

                <div className="bg-black rounded-xl overflow-hidden relative border border-slate-800">
                  {cameraLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 z-10 backdrop-blur-sm">
                      <Loader className="w-7 h-7 animate-spin text-slate-100" />
                    </div>
                  )}

                  {currentCameraImage ? (
                    <img
                      src={currentCameraImage}
                      alt="Live camera feed"
                      className="w-full h-auto max-h-[260px] object-cover"
                    />
                  ) : (
                    <div className="w-full h-[220px] flex items-center justify-center text-slate-500 text-xs px-4 text-center">
                      {noCamerasMatchFilters
                        ? "No cameras match the current filters."
                        : "Select a camera from the list."}
                    </div>
                  )}
                </div>

                {lastImageUpdate && (
                  <p className="text-[11px] text-slate-400 text-center mt-2">
                    Last updated:{" "}
                    <span className="font-mono">
                      {lastImageUpdate.toLocaleDateString()} {lastImageUpdate.toLocaleTimeString()}
                    </span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-700 rounded-2xl p-5 bg-slate-900/70">
                  <h4 className="font-semibold mb-4 text-center text-slate-100 text-xl">
                    Location details
                  </h4>

                  <p className="text-lg text-slate-300 text-center leading-relaxed">
                    {nearestWeatherStation ? (
                      <>
                        <span className="font-bold text-slate-50 text-xl">
                          {nearestWeatherStation.name}
                        </span>
                        {selectedRegion && (
                          <>
                            <br />
                            Region:{" "}
                            <span className="font-semibold text-slate-100 text-lg">
                              {selectedRegion}
                            </span>
                          </>
                        )}
                        {nearestWeatherStation.roadTemperature !== undefined && (
                          <>
                            <br />
                            Road:{" "}
                            <span className="font-semibold text-slate-100 text-lg">
                              {formatTemp(nearestWeatherStation.roadTemperature)}
                            </span>
                          </>
                        )}
                        {nearestWeatherStation.airTemperature !== undefined && (
                          <>
                            <br />
                            Air:{" "}
                            <span className="font-semibold text-slate-100 text-lg">
                              {formatTemp(nearestWeatherStation.airTemperature)}
                            </span>
                          </>
                        )}
                      </>
                    ) : (
                      <>Location: {searchLocation || "N/A"}</>
                    )}
                  </p>

                  {selectedCameraLocation && (
                    <p className="text-base text-slate-500 text-center mt-3">
                      Lat: {selectedCameraLocation.lat.toFixed(3)}, Lon:{" "}
                      {selectedCameraLocation.lon.toFixed(3)}
                    </p>
                  )}

                  {nearestWeatherStation && (
                    <div className="mt-4 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-slate-600 bg-slate-800 mr-2 text-slate-200 text-base">
                        Selected: <span className="font-semibold text-lg ml-1">{conditions}</span>
                      </span>

                      {detectedCondition && (
                        <span
                          className={
                            "inline-flex items-center justify-center px-3 py-1 rounded-full border text-base " +
                            (detectedCondition === conditions
                              ? "border-emerald-400 text-emerald-300 bg-emerald-500/10"
                              : "border-amber-400 text-amber-300 bg-amber-500/10")
                          }
                        >
                          Detected:{" "}
                          <span className="font-semibold text-lg ml-1">{detectedCondition}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="border border-slate-700 rounded-2xl p-6 bg-slate-900/80">
                    <label className="block text-lg font-semibold text-slate-200 mb-3">
                      Live camera
                    </label>

                    <div className="flex items-center justify-between gap-3 mb-4">
                      <span className="text-xs text-slate-400">
                        Cameras available:{" "}
                        <span className="font-semibold text-slate-100">
                          {filteredCameraPresets.length}
                        </span>
                      </span>

                      <select
                        value={cameraSort}
                        onChange={(e) => setCameraSort(e.target.value as "name" | "id")}
                        className="px-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                      >
                        <option value="name">Station name</option>
                        <option value="id">Preset ID</option>
                      </select>
                    </div>

                    <select
                      value={selectedCamera}
                      onChange={(e) => setSelectedCamera(e.target.value)}
                      className="w-full px-5 py-3 rounded-xl bg-slate-950 border border-slate-700 text-xl text-slate-100"
                      disabled={cameraPresets.length === 0}
                    >
                      {cameraPresets.length === 0 ? (
                        <option>Loading cameras...</option>
                      ) : filteredCameraPresets.length === 0 ? (
                        <option>No cameras match filters</option>
                      ) : (
                        filteredCameraPresets.map((preset) => (
                          <option key={preset.id} value={preset.id}>
                            {preset.presentationName}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="border border-slate-700 rounded-2xl p-5 bg-slate-900/80">
                      <label className="block text-lg font-semibold text-slate-200 mb-3">
                        Road type
                      </label>

                      <select
                        value={roadType}
                        onChange={(e) => setRoadType(e.target.value as typeof roadType)}
                        className="w-full px-5 py-3 rounded-xl bg-slate-950 border border-slate-700 text-xl text-slate-100"
                      >
                        <option value="Highways">Highways</option>
                        <option value="Local Roads">Local Roads</option>
                        <option value="City Streets">City Streets</option>
                      </select>
                    </div>

                    <div className="border border-slate-700 rounded-2xl p-5 bg-slate-900/80">
                      <label className="block text-lg font-semibold text-slate-200 mb-3">
                        Road Conditions
                      </label>

                      <select
                        value={conditions}
                        onChange={(e) => setConditions(e.target.value as typeof conditions)}
                        className="w-full px-5 py-3 rounded-xl bg-slate-950 border border-slate-700 text-xl text-slate-100"
                      >
                        <option value="Icy">Icy</option>
                        <option value="Clear">Clear</option>
                        <option value="Wet">Wet</option>
                        <option value="Snowy">Snowy</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-sm p-6">
              <h2 className="text-lg font-semibold text-slate-50 flex items-center gap-2 mb-4">
                <span className="inline-flex h-8 w-8 rounded-full bg-emerald-500/10 items-center justify-center">
                  <Sun className="h-4 w-4 text-emerald-300" />
                </span>
                Weather Forecast & Alerts
              </h2>

              <div className="border border-slate-800 rounded-2xl p-4 mb-4 bg-slate-950/60">
                {loading ? (
                  <div className="flex items-center justify-center py-7 text-slate-300">
                    <Loader className="w-6 h-6 animate-spin mr-2" />
                    Loading weather data...
                  </div>
                ) : error ? (
                  <div className="text-center text-rose-400 text-sm py-4">{error}</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {weatherData.map((item: WeatherData, index: number) => {
                      const isNow = index === 0;
                      const tempDisplay =
                        item.tempValue !== undefined
                          ? Math.round(convertTempNumber(item.tempValue))
                          : parseInt(item.temp, 10);

                      return (
                        <div
                          key={index}
                          className={`relative border rounded-xl p-3 flex flex-col items-center ${
                            isNow
                              ? "border-emerald-400 bg-emerald-500/10 shadow-lg"
                              : "border-slate-800 bg-slate-900/80"
                          }`}
                        >
                          {isNow && (
                            <span className="absolute top-1 right-2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-semibold">
                              NOW
                            </span>
                          )}
                          {renderWeatherIcon(item.icon)}
                          <div className="text-base font-semibold mt-2 text-slate-50">
                            {tempDisplay}
                            {unitSymbol}
                          </div>
                          <div className="text-xs text-slate-400">{item.time}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border border-slate-800 rounded-2xl p-5 mb-4 bg-slate-950/60">
                <h3 className="text-lg font-semibold text-slate-100 mb-3">
                  FMI Road Weather Point Forecast
                </h3>

                {selectedCamera && nearestWeatherStation && fmiPointData ? (
                  <div className="grid grid-cols-3 gap-3 text-base">
                    <div className="border border-slate-800 rounded-xl p-3 text-center bg-slate-900/80">
                      <div className="text-sm text-slate-400 mb-1">Region</div>
                      <div className="font-semibold text-slate-50 text-lg">
                        {selectedRegion || "N/A"}
                      </div>
                    </div>

                    <div className="border border-slate-800 rounded-xl p-3 text-center bg-slate-900/80">
                      <div className="text-sm text-slate-400 mb-1">Temperature</div>
                      <div className="font-semibold text-slate-50 text-lg">
                        {fmiPointData.temperature !== undefined
                          ? formatTemp(fmiPointData.temperature)
                          : "-"}
                      </div>
                    </div>

                    <div className="border border-slate-800 rounded-xl p-3 text-center bg-slate-900/80">
                      <div className="text-sm text-slate-400 mb-1">Wind speed</div>
                      <div className="font-semibold text-slate-50 text-lg">
                        {fmiPointData.windSpeed !== undefined
                          ? `${fmiPointData.windSpeed.toFixed(1)} m/s`
                          : "-"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-base text-slate-400">
                    Select a live camera to view FMI point forecast.
                  </div>
                )}
              </div>

              <div className="border border-slate-800 rounded-2xl p-5 bg-slate-950/60">
                <div className="flex items-center justify-between mb-3 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">
                      Alerts {selectedRegion && <span className="text-sm text-slate-400">({selectedRegion})</span>}
                    </h3>
                    <span className="text-xs text-slate-500">
                      Notification mode:{" "}
                      <span className="font-semibold text-slate-100">
                        {notificationModeLabel}
                      </span>
                    </span>
                  </div>

                  <select
                    value={selectedAlertType}
                    onChange={(e) => setSelectedAlertType(e.target.value)}
                    className="px-3 py-1.5 text-sm rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                  >
                    <option value="all">All types</option>
                    {alertTypeOptions.map(([value, label]) =>
                      typeof value === "string" && typeof label === "string" ? (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ) : null
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {displayAlerts.map((alert: Alert, index: number) => (
                      <div
                        key={index}
                        className="flex flex-col gap-1 border border-slate-800 rounded-xl p-3 bg-slate-900/80"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${
                              alert.color === "red"
                                ? "bg-rose-500"
                                : alert.color === "green"
                                ? "bg-emerald-400"
                                : "bg-amber-400"
                            }`}
                          />
                          <span className="text-xs uppercase tracking-wide text-slate-200">
                            {alert.eventName || "Weather warning"}
                          </span>
                          <span className="ml-auto text-xs text-slate-500">
                            {alert.severity}
                          </span>
                        </div>

                        <span className="text-sm text-slate-300">{alert.text}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-center border border-slate-800 rounded-2xl p-3 bg-slate-900/80">
                    {selectedCameraLocation ? (
                      <MapContainer
                        center={[selectedCameraLocation.lat, selectedCameraLocation.lon]}
                        zoom={8}
                        scrollWheelZoom={false}
                        className="w-full h-80 rounded-xl overflow-hidden"
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution="&copy; OpenStreetMap contributors"
                        />
                        <Circle
                          center={[selectedCameraLocation.lat, selectedCameraLocation.lon]}
                          radius={20000}
                          pathOptions={{ color: "skyblue", fillOpacity: 0.2 }}
                        />
                      </MapContainer>
                    ) : (
                      <p className="text-sm text-slate-400 text-center px-4">
                        Select a live camera to view the location on the map.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrafficWeatherDashboard;