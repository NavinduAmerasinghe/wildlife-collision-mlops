import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { test, describe, expect, vi } from 'vitest';

import { createTestStore } from '../utils/testRedux';

vi.mock("../hooks/useAxios", () => ({
  default: vi.fn(() => ({
    data: null,
    loading: false,
    error: null,
    refetch: vi.fn(),
  }))
}));

vi.mock('./SettingsContext', () => ({
  useSettings: () => ({
    theme: 'dark',
    temperatureUnit: 'celsius',
    locationEnabled: true,
  }),
}));

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children, ...props }) => (
    <div data-testid="map-container" {...props}>{children}</div>
  ),
  TileLayer: (props) => <div data-testid="tile-layer" {...props} />,
  Marker: ({ children }) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
}));

const store = createTestStore({
  ui: {
    homeView: {
      hour: 12,
      location: { lat: 60, lng: 25 },
      timeData:
        [
          {
            dataType: "temperature",
            timestamp: new Date().toISOString(),
            value: 6
          },
          {
            dataType: "wind_speed",
            timestamp: new Date().toISOString(),
            value: 4
          },
          {
            dataType: "precipitation",
            timestamp: new Date().toISOString(),
            value: 1
          }
        ]
      ,
      mapData: [],
      mapError: null,
      weatherData: [],
      weatherError: null,
      summaryData: {
        temperature: 5,
        roadSurfaceFriction: 0.7,
        trafficCongestionLevel: "0.3",
        alerts: ["Accident on E12"],
      },
      summaryError: null,
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
import HomeView from './HomeView';
import useAxios from '../hooks/useAxios';
import { Provider } from "react-redux";

describe("HomeView tests", () => {
  test("renders current temperature, wind and precipitation", () => {
    render(<Provider store={store}><HomeView /></Provider>);

    expect(screen.getByText("Temperature")).toBeInTheDocument();
    expect(screen.getByText("6°C")).toBeInTheDocument();

    expect(screen.getByText("Wind")).toBeInTheDocument();
    expect(screen.getByText("4 m/s")).toBeInTheDocument();

    expect(screen.getByText("Precipitation")).toBeInTheDocument();
    expect(screen.getByText("1 mm")).toBeInTheDocument();
  });

  test("shows road alerts list", () => {
    render(<Provider store={store}><HomeView /></Provider>);

    expect(screen.getByText("Accidents")).toBeInTheDocument();
    expect(screen.getByText("Accident on E12")).toBeInTheDocument();
  });

  test("slider updates hour state when moved", () => {
    render(<Provider store={store}><HomeView /></Provider>);

    const slider = screen.getByRole("slider");

    expect(slider).toHaveAttribute("aria-valuenow", "12");

    fireEvent.keyDown(slider, { key: "ArrowRight" });

    expect(slider).toHaveAttribute("aria-valuenow", "13");
  });

  test("shows loading spinner when weather is loading", () => {
    vi.mocked(useAxios).mockReturnValueOnce({
      data: null,
      loading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(<Provider store={store}><HomeView /></Provider>);

    expect(screen.getAllByRole("progressbar").length).toBeGreaterThan(0);
  });

  test("update data based on fetch result", async () => {
    vi.mocked(useAxios)
      .mockReturnValueOnce({ data: null, loading: false, error: null, refetch: vi.fn() }) // weather
      .mockReturnValueOnce({ data: null, loading: false, error: null, refetch: vi.fn() }) // summary
      .mockReturnValueOnce({ data: null, loading: false, error: null, refetch: vi.fn() }) // map
      .mockReturnValueOnce({ data: null, loading: false, error: null, refetch: vi.fn() }); // time

    const { rerender } = render(
      <Provider store={store}>
        <HomeView />
      </Provider>
    );

    expect(screen.getByText("6°C")).toBeInTheDocument();
    expect(screen.getByText("4 m/s")).toBeInTheDocument();
    expect(screen.getByText("1 mm")).toBeInTheDocument();

    vi.mocked(useAxios)
      .mockReturnValueOnce({ data: null, loading: false, error: null, refetch: vi.fn() }) // weather
      .mockReturnValueOnce({ data: null, loading: false, error: null, refetch: vi.fn() }) // summary
      .mockReturnValueOnce({ data: null, loading: false, error: null, refetch: vi.fn() }) // map
      .mockReturnValueOnce({                                                 // timeline ✔
        data: [
          {
            dataType: "temperature",
            timestamp: new Date().toISOString(),
            value: 12,
          },
          {
            dataType: "wind_speed",
            timestamp: new Date().toISOString(),
            value: 10,
          },
          {
            dataType: "precipitation",
            timestamp: new Date().toISOString(),
            value: 0,
          },
        ],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

    rerender(
      <Provider store={store}>
        <HomeView />
      </Provider>
    );

    expect(await screen.findByText("12°C")).toBeInTheDocument();
    expect(screen.getByText("10 m/s")).toBeInTheDocument();
    expect(screen.getByText("0 mm")).toBeInTheDocument();
  });

  test("renders map with markers and popup content", async () => {
    vi.mocked(useAxios)
      .mockReturnValueOnce({
        data: [{ region: "Helsinki", temperature: 5, windSpeed: 3, precipitation: 1 }],
        loading: false,
        error: null,
        refetch: vi.fn(),
      })
      .mockReturnValueOnce({
        data: { alerts: ["Accident"], temperature: 3 },
        loading: false,
        error: null,
        refetch: vi.fn(),
      })
      .mockReturnValueOnce({
        data: [
          {
            id: 1,
            name: "Road 4",
            latitude: 60.17,
            longitude: 24.94,
            roadCondition: "Icy",
          }
        ],
        loading: false,
        error: null,
        refetch: vi.fn(),
      })
      .mockReturnValueOnce({
        data: [
          {
            dataType: "temperature",
            timestamp: new Date().toISOString(),
            value: 5
          },
        ],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

    render(
      <Provider store={store}>
        <HomeView />
      </Provider>
    );

    expect(screen.getByTestId("map-container")).toBeInTheDocument();

    expect(screen.getByTestId("tile-layer")).toHaveAttribute(
      "url",
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    );

    expect(screen.getAllByTestId("marker")).toHaveLength(1);

    expect(screen.getByTestId("popup")).toHaveTextContent("Road 4");
    expect(screen.getByTestId("popup")).toHaveTextContent("RoadCondition: Icy");
    expect(screen.getByTestId("popup")).toHaveTextContent("Temperature: 5°C");
    expect(screen.getByTestId("popup")).toHaveTextContent("WindSpeed: 3 m/s");
    expect(screen.getByTestId("popup")).toHaveTextContent("Precipitation: 1 mm");
  });
})