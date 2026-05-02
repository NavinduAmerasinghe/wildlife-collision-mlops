interface FrictionPoint {
  timeLabel: string;
  frictionFrom?: number;
  frictionTo?: number;
  friction?: number; // For single station plotting
}

interface TrafficPoint {
  timeLabel: string;
  volumeFrom?: number;
  volumeTo?: number;
}

interface ForecastHour {
  time: string;
  tempC: number;
  precipMm: number;
}

interface RouteLocation {
  id: string;
  label: string;
  lat: number;
  lon: number;
}

type DepartureChoice = 'now' | 'plus1' | 'plus2';

export type {
  FrictionPoint,
  TrafficPoint,
  ForecastHour,
  RouteLocation,
  DepartureChoice
}