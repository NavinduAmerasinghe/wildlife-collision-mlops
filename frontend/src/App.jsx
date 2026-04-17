
import React, { useState } from "react";
import HeroSection from "./components/HeroSection";
import SummaryCards from "./components/SummaryCards";
import DataSourcesSection from "./components/DataSourcesSection";
import PipelineOverview from "./components/PipelineOverview";
import PredictionForm from "./components/PredictionForm";
import PredictionResult from "./components/PredictionResult";
import ExplanationPanel from "./components/ExplanationPanel";
import ImpactSection from "./components/ImpactSection";
import "./index.css";

// Main dashboard app
function App() {
  // State for prediction result, loading, error, and last input
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastInput, setLastInput] = useState(null);

  // Handle prediction submission
  const handlePredict = async (inputData) => {
    setLoading(true);
    setError("");
    setResult(null);
    setLastInput(inputData);
    try {
      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputData),
      });
      if (!response.ok) {
        throw new Error("Prediction failed: " + (await response.text()));
      }
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Hero/Header section */}
      <HeroSection />

      {/* Project summary cards */}
      <SummaryCards />

      {/* Data sources section */}
      <DataSourcesSection />

      {/* Pipeline overview section */}
      <PipelineOverview />

      {/* Prediction form and result */}
      <section className="prediction-section">
        <h2>Try the Prediction Demo</h2>
        <PredictionForm onPredict={handlePredict} loading={loading} />
        {error && <div className="error">{error}</div>}
        <PredictionResult result={result} />
        {/* Simple explanation panel based on input */}
        <ExplanationPanel input={lastInput} result={result} />
      </section>

      {/* Impact and usefulness section */}
      <ImpactSection />
    </div>
  );
}

export default App;