import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "../redux/uireducer";
import type { RootState } from "../redux/store";

export function createTestStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: {
      ui: uiReducer,
    },
    preloadedState,
    middleware: (getDefault) =>
      getDefault({
        serializableCheck: false,
      }),
  });
}

export const initStore = createTestStore({
  ui: {
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
}
});