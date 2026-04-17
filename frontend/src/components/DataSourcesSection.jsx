import React from "react";

// Cards for each data source
function DataSourcesSection() {
  const sources = [
    {
      title: "Wildlife Incidents",
      desc: "Records of past animal-vehicle collisions help identify high-risk locations and times."
    },
    {
      title: "Weather Data",
      desc: "Weather conditions like precipitation, wind, and visibility affect animal movement and driver safety."
    },
    {
      title: "Road Context",
      desc: "Speed limits, road type, and traffic patterns influence collision likelihood and severity."
    }
  ];
  return (
    <section className="data-sources-section">
      <h2>Data Sources</h2>
      <div className="data-source-cards">
        {sources.map((src, idx) => (
          <div className="data-source-card" key={idx}>
            <h4>{src.title}</h4>
            <p>{src.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default DataSourcesSection;
