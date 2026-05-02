import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RoadType } from '../views/roadTypeUtils';
import { MapData, WeatherData, SummaryData, TimeData } from "../types/Home";
import {
  WeatherData as WeatherData2,
  Alert,
  CameraStation,
  CameraPreset,
  RoadWeatherStation,
  FmiPointData,
  ToastType
} from "../types/TrafficWeather";

import { 
  FrictionPoint, 
  TrafficPoint, 
  ForecastHour, 
  RouteLocation,
  DepartureChoice 
} from '../types/AnalyticsAndTrends'
import { RouteSummaryData, RouteTimelineData, SearchData } from "../types/Location";

interface UiState {
  homeView: {
    hour: number,
    location: { lat: number; lng: number },
    mapData: MapData[],
    mapError: string | null,
    weatherData: WeatherData[],
    weatherError: string | null,
    summaryData: SummaryData,
    summaryError: string | null,
    timeData: TimeData[],
    timeError: string | null,

  },
  analyticsView: {
    routeLocations: RouteLocation[],
    fromLocationId: string,
    toLocationId: string,
    locationsError: string | null,
    frictionData: FrictionPoint[],
    trafficData: TrafficPoint[],
    chartsError: string | null,
    departureChoice: DepartureChoice
  },
  locationView: {
    timeWindow: [number, number],
    openSummary: boolean,
    openAlerts: boolean,
    city: string,
    road: string,
    searchData: SearchData,
    searchError: string | null,
    roadData: RouteSummaryData,
    roadError: string | null,
    timeData: RouteTimelineData[],
    timeError: string | null
  },
  trafficView: {
    searchLocation: string,
    selectedCamera: string,
    roadType: RoadType,
    conditions: 'Icy' | 'Clear' | 'Wet' | 'Snowy',
    weatherData: WeatherData2[],
    alerts: Alert[],
    error: string | null,
    currentTempC: number | null,
    cameraStations: CameraStation[],
    cameraPresets: CameraPreset[],
    currentCameraImage: string,
    lastImageUpdate: Date | null,
    selectedCameraLocation: {
      lat: number;
      lon: number;
    },
    nearestWeatherStation: RoadWeatherStation | null,
    selectedRegion: string | null,
    fmiPointData: FmiPointData | null,
    selectedAlertType: string,
    toast: { message: string; type: ToastType } | null,
    lastDetectedCondition: 'Icy' | 'Snowy' | 'Wet' | 'Clear' | null,
    cameraSort: 'name' | 'id',
  }
}

const initialState: UiState = {
  homeView: {
    hour: 12,
    location: { lat: 60.192059, lng: 24.945831 },
    mapData: null,
    mapError: null,
    weatherData: null,
    weatherError: null,
    summaryData: null,
    summaryError: null,
    timeData: null,
    timeError: null
  },
  locationView: {
    timeWindow: [0, 6],
    openSummary: true,
    openAlerts: true,
    city: '',
    road: '',
    searchData: null,
    searchError: null,
    roadData: null,
    roadError: null,
    timeData: null,
    timeError: null
  },
  analyticsView: {
    routeLocations: [],
    fromLocationId: '',
    toLocationId: '',
    locationsError: null,
    frictionData: [],
    trafficData: [],
    chartsError: null,
    departureChoice: 'now'
  },
  trafficView: {
    searchLocation: '',
    selectedCamera: '',
    roadType: 'Highways',
    conditions: 'Icy',
    weatherData: [],
    alerts: [],
    error: '',
    currentTempC: null,
    cameraStations: [],
    cameraPresets: [],
    currentCameraImage: '',
    lastImageUpdate: null,
    selectedCameraLocation: null,
    nearestWeatherStation: null,
    selectedRegion: null,
    fmiPointData: null,
    selectedAlertType: 'all',
    toast: null,
    lastDetectedCondition: null,
    cameraSort: 'name',
  }
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    updateHomeField<K extends keyof UiState["homeView"]>(
      state,
      action: PayloadAction<{
        key: K;
        value: UiState["homeView"][K];
      }>
    ) {
      state.homeView[action.payload.key] = action.payload.value;
    },
    updateLocationField<K extends keyof UiState["locationView"]>(
      state,
      action: PayloadAction<{
        key: K;
        value: UiState["locationView"][K];
      }>
    ) {
      state.locationView[action.payload.key] = action.payload.value;
    },
    updateAnalyticsField<K extends keyof UiState["analyticsView"]>(
      state,
      action: PayloadAction<{
        key: K;
        value: UiState["analyticsView"][K];
      }>
    ) {
      state.analyticsView[action.payload.key] = action.payload.value;
    },
    updateTrafficField<K extends keyof UiState["trafficView"]>(
      state,
      action: PayloadAction<{
        key: K;
        value: UiState["trafficView"][K];
      }>
    ) {
      state.trafficView[action.payload.key] = action.payload.value;
    }
  },
});

export const { updateHomeField, updateLocationField, updateAnalyticsField, updateTrafficField } = uiSlice.actions;
export default uiSlice.reducer;