interface MapData {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  roadCondition: string;
}

interface WeatherData {
  region: string
  weatherIcon: string
  temperature: number
  windSpeed: number
  precipitation: number
}

interface SummaryData {
  temperature: number,
  roadSurfaceFriction: number,
  trafficCongestionLevel: string,
  alerts: [
    string
  ]
}

interface TimeData {
  timestamp: string,
  value: number,
  dataType: string
}

export type { MapData, WeatherData, SummaryData, TimeData }