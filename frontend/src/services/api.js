// Simple API helper for prediction requests
export async function predictRisk(inputData) {
  const response = await fetch("http://127.0.0.1:8000/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(inputData),
  });
  if (!response.ok) {
    throw new Error("Prediction failed: " + (await response.text()));
  }
  return await response.json();
}
