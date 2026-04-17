import React from "react";

// Cards summarizing project value
function SummaryCards() {
  const cards = [
    {
      title: "Why It Matters",
      text: "Wildlife-vehicle collisions cause injuries, fatalities, and economic loss. Predicting risk helps save lives and protect animals."
    },
    {
      title: "Predictive Risk Scoring",
      text: "Machine learning analyzes road, weather, and wildlife data to score collision risk in real time."
    },
    {
      title: "Data-Driven Safety",
      text: "Combining multiple data sources enables smarter, targeted interventions for road safety."
    },
    {
      title: "Real-World Impact",
      text: "Supports road planners, drivers, and wildlife managers with actionable insights for mitigation."
    }
  ];
  return (
    <section className="summary-cards">
      {cards.map((card, idx) => (
        <div className="summary-card" key={idx}>
          <h3>{card.title}</h3>
          <p>{card.text}</p>
        </div>
      ))}
    </section>
  );
}

export default SummaryCards;
