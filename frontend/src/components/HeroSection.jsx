import React from "react";
import "../index.css";

// Hero section with project title and purpose
function HeroSection() {
  return (
    <section className="hero-section">
      <h1>Wildlife Collision Risk Prediction</h1>
      <p className="hero-desc">
        An end-to-end MLOps showcase for predicting and mitigating animal-vehicle collisions using real-world data and machine learning.
      </p>
      <p className="hero-purpose">
        <strong>Purpose:</strong> Empower road safety with data-driven risk prediction and actionable insights.
      </p>
    </section>
  );
}

export default HeroSection;
