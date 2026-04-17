import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line
} from "recharts";

// Mock data for charts
const incidentsByMonth = [
  { month: "Jan", incidents: 80 },
  { month: "Feb", incidents: 65 },
  { month: "Mar", incidents: 90 },
  { month: "Apr", incidents: 110 },
  { month: "May", incidents: 130 },
  { month: "Jun", incidents: 120 },
  { month: "Jul", incidents: 100 },
  { month: "Aug", incidents: 95 },
  { month: "Sep", incidents: 105 },
  { month: "Oct", incidents: 115 },
  { month: "Nov", incidents: 98 },
  { month: "Dec", incidents: 70 },
];

const riskTrend = [
  { date: "2026-04-01", high: 8, low: 22 },
  { date: "2026-04-02", high: 7, low: 25 },
  { date: "2026-04-03", high: 10, low: 20 },
  { date: "2026-04-04", high: 12, low: 18 },
  { date: "2026-04-05", high: 9, low: 21 },
  { date: "2026-04-06", high: 11, low: 19 },
  { date: "2026-04-07", high: 13, low: 17 },
];

// HistoricalTrends: two simple charts
function HistoricalTrends() {
  return (
    <section className="historical-trends-section">
      <h2>Historical Trends</h2>
      <div className="charts-row">
        <div className="chart-card">
          <h4>Incidents by Month</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={incidentsByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="incidents" fill="#1976d2" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h4>Risk Trend (Last 7 Days)</h4>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={riskTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="high" stroke="#d32f2f" name="High Risk" />
              <Line type="monotone" dataKey="low" stroke="#388e3c" name="Low Risk" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

export default HistoricalTrends;
