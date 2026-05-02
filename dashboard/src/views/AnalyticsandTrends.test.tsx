// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import React from 'react';


import { Provider } from "react-redux";
import { initStore } from '../utils/testRedux';


vi.mock('./SettingsContext', () => ({
  useSettings: () => ({
    theme: 'dark',
    temperatureUnit: 'celsius',
    locationEnabled: true,
  }),
}));

vi.mock('recharts', () => {
  const Mock = ({ children }: any) => <div>{children}</div>;
  return {
    LineChart: Mock,
    Line: Mock,
    XAxis: Mock,
    YAxis: Mock,
    CartesianGrid: Mock,
    ResponsiveContainer: Mock,
    Tooltip: Mock,
  };
});


beforeEach(() => {
  (global as any).fetch = vi.fn((url: string) => {
    // Digitraffic stations
    if (url.includes('tie.digitraffic.fi/api/weather/v1/stations')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          features: [
            {
              id: '1',
              geometry: { coordinates: [23.7, 61.5] },
              properties: { name: 'Station A' },
            },
            {
              id: '2',
              geometry: { coordinates: [24.0, 61.6] },
              properties: { name: 'Station B' },
            },
          ],
        }),
      } as Response);
    }

    // Open-Meteo forecast
    if (url.includes('api.open-meteo.com')) {
      return Promise.resolve({
        ok: true,
        json: async () => {
          const times = [
            '2025-01-01T00:00:00Z',
            '2025-01-01T01:00:00Z',
            '2025-01-01T02:00:00Z',
          ];
          return {
            hourly: {
              time: times,
              temperature_2m: [0, -1, -2],
              precipitation: [0, 0.5, 2],
            },
          };
        },
      } as Response);
    }

    return Promise.resolve({
      ok: true,
      json: async () => ({}),
    } as Response);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

import AnalyticsandTrends from './AnalyticsandTrends';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('AnalyticsandTrends', () => {
  it('renders analytics and route selection sections without crashing', () => {
    render(<Provider store={initStore}><AnalyticsandTrends /></Provider>);

    expect(
      screen.getByText(/Analytics & Route Prediction/i)
    ).toBeInTheDocument();

    expect(screen.getByText(/Route selection/i)).toBeInTheDocument();


    expect(
      screen.getByText(/Compare two Finnish road weather stations/i)
    ).toBeInTheDocument();
  });
});
