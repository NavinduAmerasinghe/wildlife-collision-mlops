import axios from 'axios'

// Single source of truth for API base URL
// const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL
const rawApiBaseUrl = "https://traverse-bountiful-conceded.ngrok-free.dev/"
const apiBaseUrl = rawApiBaseUrl?.trim() ? rawApiBaseUrl.replace(/\/$/, '') : 'http://localhost:8000'

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
})

export default apiClient
