import apiClient from './apiClient'

export const checkHealth = async () => {
  const res = await apiClient.get('/health')
  return res.data
}

export const predictRisk = async (payload) => {
  const res = await apiClient.post('/predict', payload)
  return res.data
}

export const fetchDashboardSummary = async () => {
  const res = await apiClient.get('/dashboard/summary')
  return res.data
}

export const fetchPipelineStatus = async () => {
  const res = await apiClient.get('/dashboard/pipeline-status')
  return res.data
}

export const fetchModelComparison = async () => {
  const res = await apiClient.get('/dashboard/model-comparison')
  return res.data
}
