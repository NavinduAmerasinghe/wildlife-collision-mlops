// import axios from 'axios'

// // Single source of truth for API base URL
// // const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL
// const rawApiBaseUrl = 'http://localhost:8000'
// const apiBaseUrl = rawApiBaseUrl?.trim() ? rawApiBaseUrl.replace(/\/$/, '') : 'http://localhost:8000'

// export const apiClient = axios.create({
//   baseURL: apiBaseUrl,
//   headers: { 'Content-Type': 'application/json' },
// })

// export default apiClient
import axios from "axios";

const rawApiBaseUrl = "https://traverse-bountiful-conceded.ngrok-free.dev";

const apiBaseUrl = rawApiBaseUrl.replace(/\/$/, "");

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

export default apiClient;