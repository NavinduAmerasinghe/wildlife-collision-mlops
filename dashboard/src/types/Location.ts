interface RouteTimelineData {
    timestamp: Date;
    condition: string;
    temp: number;
    precipitation: number;
    hazard: string;
  }

  interface Condition {
    condition: string;
    roadSurfaceTemperature: number;
    frictionEstimate: number;
  }

  interface WeatherForecast {
    forecastTime: Date;
    temperature: number;
    precipitationAmount: number;
    weatherCondition: string;
    windSpeed: number;
  }

  interface TrafficFlow {
    timestamp: Date;
    congestionLevel: string;
    averageSpeed: number;
    vehicleCount: number;
  }

  interface RouteSummaryData {
    routeName: string,
    conditions: Condition[];
    weatherForecasts: WeatherForecast[];
    trafficFlows: TrafficFlow[];
    hazards: string[];
  }

  interface SearchData {
    city: string;
    roadName: string;
    latitude: number;
    longitude: number;
    displayName: string;
  }

  export type {
    RouteTimelineData,
    Condition,
    WeatherForecast,
    TrafficFlow,
    RouteSummaryData,
    SearchData
  }