import axios from 'axios'
import { useState, useEffect, useCallback } from 'react'

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL
const apiBaseUrl = rawApiBaseUrl?.trim() ? rawApiBaseUrl.replace(/\/$/, '') : '/api'

const api = axios.create({
  baseURL: "https://traverse-bountiful-conceded.ngrok-free.dev/api",
  headers: { 'Content-Type': 'application/json' },
})

interface UseAxiosProps {
  url: string
  method?: 'get' | 'post' | 'put' | 'delete'
  body?: any
  dependencies?: any[]
  immediate?: boolean
}

export default function useAxios<T = any>({
  url,
  method = 'get',
  body,
  dependencies = [],
  immediate = true,
}: UseAxiosProps) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.request<T>({
        url,
        method,
        data: body,
      })
      setData(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }, [url, method, body])

  useEffect(() => {
    if (immediate) {
      fetchData()
    }
  }, [immediate, fetchData, ...dependencies])

  return { data, loading, error, refetch: fetchData }
}