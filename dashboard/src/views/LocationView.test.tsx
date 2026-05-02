import { render, screen, fireEvent, within } from '@testing-library/react';
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

const store = createTestStore({
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
            timeWindow: [0, 5],
            openSummary: true,
            openAlerts: true,
            city: "",
            road: "",
            searchData: null,
            searchError: null,
            roadError: null,
            timeError: null,
            timeData: null,
            roadData: {
                routeName: "Test Route",
                conditions: [{
                    condition: "Icy",
                    roadSurfaceTemperature: -3,
                    frictionEstimate: 0.4,
                }],
                weatherForecasts: [{
                    weatherCondition: "Snow",
                    forecastTime: new Date(),
                    temperature: -5,
                    precipitationAmount: 2,
                    windSpeed: 4,
                }],
                trafficFlows: [{
                    congestionLevel: "Heavy",
                    timestamp: new Date(),
                    averageSpeed: 45,
                    vehicleCount: 120,
                }],
                hazards: [],
            },
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
import LocationView from './LocationView';
import useAxios from '../hooks/useAxios';
import { Provider } from "react-redux";

describe("LocationView tests", () => {
    test("renders city and road input fields", () => {
        render(<Provider store={store}><LocationView /></Provider>);

        const inputs = screen.getAllByPlaceholderText("Search");

        expect(inputs).toHaveLength(2);

        const cityInput = inputs[0];
        const roadInput = inputs[1];

        expect(cityInput).toBeInTheDocument();
        expect(roadInput).toBeInTheDocument();

        fireEvent.change(cityInput, { target: { value: "Tampere" } });
        fireEvent.change(roadInput, { target: { value: "E75" } });

        expect(cityInput).toHaveValue("Tampere");
        expect(roadInput).toHaveValue("E75");

        expect(screen.getByText("Search")).toBeInTheDocument();
    });
    test("shows loading spinner during search", () => {
        vi.mocked(useAxios)
            .mockReturnValueOnce({ data: null, loading: true, error: null, refetch: vi.fn() }) // search
            .mockReturnValueOnce({ data: null, loading: false, error: null, refetch: vi.fn() }) // route-summary
            .mockReturnValueOnce({ data: null, loading: false, error: null, refetch: vi.fn() }); // timeline

        render(<Provider store={store}><LocationView /></Provider>);

        const spinners = screen.getAllByRole("progressbar");
        expect(spinners.length).toBeGreaterThan(0);
    });

    test("shows route summary when roadData is present", () => {

        render(<Provider store={store}><LocationView /></Provider>);

        expect(screen.getByText("Road Conditions")).toBeInTheDocument();
        expect(screen.getByText("Icy")).toBeInTheDocument();
        expect(screen.getByText("Weather Forecast")).toBeInTheDocument();
        expect(screen.getByText("Snow")).toBeInTheDocument();
        expect(screen.getByText("Traffic Flow")).toBeInTheDocument();
        expect(screen.getByText("Heavy")).toBeInTheDocument();
    });

    test("slider moves and updates timeWindow state", () => {
        render(
            <Provider store={store}>
                <LocationView />
            </Provider>
        );

        const thumbs = screen.getAllByRole("slider");
        const startThumb = thumbs[0];
        const endThumb = thumbs[1];

        expect(startThumb).toHaveAttribute("aria-valuenow", "0");
        expect(endThumb).toHaveAttribute("aria-valuenow", "5");

        fireEvent.keyDown(startThumb, { key: "ArrowRight" });

        fireEvent.keyDown(endThumb, { key: "ArrowRight" });
        fireEvent.keyDown(endThumb, { key: "ArrowRight" });

        expect(startThumb).toHaveAttribute("aria-valuenow", "3");
        expect(endThumb).toHaveAttribute("aria-valuenow", "8");
    });
})