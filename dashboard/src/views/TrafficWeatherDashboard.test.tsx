// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TrafficWeatherDashboard from './TrafficWeatherDashboard';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Provider } from "react-redux";
import { initStore } from '../utils/testRedux';

vi.mock('./SettingsContext', () => ({
  useSettings: () => ({
    theme: 'dark',
    temperatureUnit: 'celsius',
    notificationType: 'push',
    locationEnabled: true, 
  }),
}));


vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => (
    <div data-testid="map-mock">{children}</div>
  ),
  TileLayer: () => null,
  Circle: () => null,
}));


beforeAll(() => {
  (global as any).Notification = class {
    static permission = 'granted';
    constructor(_title: string, _options?: any) {}
    static requestPermission = vi.fn().mockResolvedValue('granted');
  };
});

beforeEach(() => {
  (global as any).fetch = vi.fn((url: string) => {
    if (url.includes('open-meteo.com')) {
      const now = new Date();
      const hours = Array.from({ length: 24 }, (_, i) => {
        const d = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          i,
        );
        return d.toISOString();
      });

      return Promise.resolve({
        ok: true,
        json: async () => ({
          current: { temperature_2m: 5, weather_code: 0, wind_speed_10m: 1 },
          hourly: {
            temperature_2m: hours.map(() => 5),
            weather_code: hours.map(() => 0),
            time: hours,
          },
        }),
      } as Response);
    }

    if (url.includes('weathercam/v1/stations')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          features: [
            {
              id: '1',
              geometry: { coordinates: [23.7, 61.5] },
              properties: {
                name: 'Test Road',
                presets: [{ id: 100, presentationName: 'Test Camera' }],
              },
            },
          ],
        }),
      } as Response);
    }

    if (
      url.includes('weather/v1/stations') &&
      !url.endsWith('/data')
    ) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          features: [
            {
              id: 'ws1',
              geometry: { coordinates: [23.7, 61.5] },
              properties: { name: 'Test Station' },
            },
          ],
        }),
      } as Response);
    }

    if (url.includes('weather/v1/stations') && url.endsWith('/data')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          sensorValues: [
            { name: 'TIE_1', sensorValue: -1 },
            { name: 'ILMA', sensorValue: -2 },
          ],
        }),
      } as Response);
    }

    if (url.includes('alerts.fmi.fi')) {
      return Promise.resolve({
        ok: true,
        text: async () =>
          '<feed xmlns="http://www.w3.org/2005/Atom"></feed>',
      } as Response);
    }

    if (url.includes('opendata.fmi.fi')) {
      return Promise.resolve({
        ok: true,
        text: async () =>
          '<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs/2.0"></wfs:FeatureCollection>',
      } as Response);
    }

    return Promise.resolve({
      ok: true,
      json: async () => ({}),
      text: async () => '',
    } as Response);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('TrafficWeatherDashboard', () => {
  it('renders the main sections without crashing', async () => {
    render(<Provider store={initStore}><TrafficWeatherDashboard /></Provider>);

    expect(
      screen.getByText(/Smart Road Weather & Traffic Pred Dashboard/i),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText(/Live Traffic & Road Conditions/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Weather Forecast & Alerts/i),
      ).toBeInTheDocument();
    });
  });
});
