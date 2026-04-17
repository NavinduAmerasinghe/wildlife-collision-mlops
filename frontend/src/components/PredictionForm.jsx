import React, { useState } from "react";

// Initial form state
const initialState = {
  temperature: "",
  precipitation: "",
  wind_speed: "",
  visibility: "",
  speed_limit: "",
  hour: "",
  month: "",
  is_night: "0",
  is_weekend: "0",
  high_precipitation: "0",
};

function PredictionForm({ onPredict, loading }) {
  const [form, setForm] = useState(initialState);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    // Convert all values to correct types
    const payload = {
      temperature: parseFloat(form.temperature),
      precipitation: parseFloat(form.precipitation),
      wind_speed: parseFloat(form.wind_speed),
      visibility: parseFloat(form.visibility),
      speed_limit: parseFloat(form.speed_limit),
      hour: parseInt(form.hour, 10),
      month: parseInt(form.month, 10),
      is_night: parseInt(form.is_night, 10),
      is_weekend: parseInt(form.is_weekend, 10),
      high_precipitation: parseInt(form.high_precipitation, 10),
    };
    onPredict(payload);
  };

  return (
    <form className="prediction-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>Temperature (°C):</label>
        <input name="temperature" type="number" step="0.1" value={form.temperature} onChange={handleChange} required />
      </div>
      <div className="form-row">
        <label>Precipitation (mm):</label>
        <input name="precipitation" type="number" step="0.1" value={form.precipitation} onChange={handleChange} required />
      </div>
      <div className="form-row">
        <label>Wind Speed (km/h):</label>
        <input name="wind_speed" type="number" step="0.1" value={form.wind_speed} onChange={handleChange} required />
      </div>
      <div className="form-row">
        <label>Visibility (km):</label>
        <input name="visibility" type="number" step="0.1" value={form.visibility} onChange={handleChange} required />
      </div>
      <div className="form-row">
        <label>Speed Limit (km/h):</label>
        <input name="speed_limit" type="number" value={form.speed_limit} onChange={handleChange} required />
      </div>
      <div className="form-row">
        <label>Hour (0-23):</label>
        <input name="hour" type="number" min="0" max="23" value={form.hour} onChange={handleChange} required />
      </div>
      <div className="form-row">
        <label>Month (1-12):</label>
        <input name="month" type="number" min="1" max="12" value={form.month} onChange={handleChange} required />
      </div>
      <div className="form-row">
        <label>Is Night:</label>
        <select name="is_night" value={form.is_night} onChange={handleChange}>
          <option value="0">No</option>
          <option value="1">Yes</option>
        </select>
      </div>
      <div className="form-row">
        <label>Is Weekend:</label>
        <select name="is_weekend" value={form.is_weekend} onChange={handleChange}>
          <option value="0">No</option>
          <option value="1">Yes</option>
        </select>
      </div>
      <div className="form-row">
        <label>High Precipitation:</label>
        <select name="high_precipitation" value={form.high_precipitation} onChange={handleChange}>
          <option value="0">No</option>
          <option value="1">Yes</option>
        </select>
      </div>
      <button type="submit" disabled={loading}>
        {loading ? "Predicting..." : "Predict"}
      </button>
    </form>
  );
}

export default PredictionForm;
