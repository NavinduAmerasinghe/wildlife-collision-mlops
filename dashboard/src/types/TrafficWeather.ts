interface WeatherData {
  temp: string;
  time: string;
  condition: string;
  icon: string;
  tempValue?: number;
}

interface Alert {
  color: string;
  text: string;
  severity: string;
  eventCode?: string;
  eventName?: string;
}

interface CameraStation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  presets: CameraPreset[];
}

interface CameraPreset {
  id: string;
  presentationName: string;
  imageUrl: string;
  stationId: string;
}

interface RoadWeatherStation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  roadTemperature?: number;
  airTemperature?: number;
  windSpeed?: number;
  humidity?: number;
  precipitation?: number;
  roadCondition?: string;
  visibility?: number;
}

interface FmiPointData {
  temperature?: number;
  windSpeed?: number;
  phenomenonCode?: string;
  timestamp?: string;
}

type ToastType = 'info' | 'success' | 'warning';

export type {WeatherData, Alert, CameraStation, CameraPreset, RoadWeatherStation, FmiPointData, ToastType}