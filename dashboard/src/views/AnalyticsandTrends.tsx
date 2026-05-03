import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { useSettings } from './SettingsContext';
import {
  FrictionPoint,
  TrafficPoint,
  ForecastHour,
  RouteLocation,
  DepartureChoice
} from '../types/AnalyticsAndTrends'
import { useAnalyticsState } from '../redux/storeHooks';

export const estimateFriction = (tempC: number, precipMm: number): number => {
  if (tempC <= -10) return 4.1;
  if (tempC <= 0 && precipMm > 0) return 4.2;
  if (tempC <= 0) return 4.3;
  if (precipMm > 2) return 4.4;
  if (precipMm > 0) return 4.6;
  return 4.9;
};

export const estimateTrafficImpact = (tempC: number, precipMm: number): number => {

  let base = 5.0;
  if (precipMm > 2) base -= 0.4;
  else if (precipMm > 0) base -= 0.2;
  if (tempC < -10) base -= 0.3;
  if (tempC < 0 && precipMm > 0) base -= 0.2;


  return Math.max(4.0, Math.min(5.5, base));
};

const fetchForecastSeries = async (lat: number, lon: number): Promise<ForecastHour[]> => {
  const res = await fetch(
    `http://localhost:8080/api/analytics/forecast?lat=${lat}&lon=${lon}`
  );

  if (!res.ok) {
    throw new Error('Failed to fetch forecast');
  }

  const data: ForecastHour[] = await res.json();
  return data;
};

const AnalyticsandTrends: React.FC = () => {
  const { theme, temperatureUnit, locationEnabled } = useSettings();

  const [routeLocations, setRouteLocations] = useAnalyticsState('routeLocations')
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationsError, setLocationsError] = useAnalyticsState('locationsError')

  const [fromLocationId, setFromLocationId] = useAnalyticsState('fromLocationId')
  const [toLocationId, setToLocationId] = useAnalyticsState('toLocationId')

  const [frictionData, setFrictionData] = useAnalyticsState('frictionData')
  const [trafficData, setTrafficData] = useAnalyticsState('trafficData')
  const [chartsLoading, setChartsLoading] = useState(false);
  const [chartsError, setChartsError] = useAnalyticsState('chartsError')

  const [departureChoice, setDepartureChoice] = useAnalyticsState('departureChoice')

  const temperatureLabelUnit = temperatureUnit === 'celsius' ? '°C' : '°F';

  useEffect(() => {
    const loadLocations = async () => {
      try {
        setLocationsLoading(true);
        setLocationsError(null);

        const res = await fetch('http://localhost:8080/api/analytics/stations');

        if (!res.ok) {
          throw new Error('Failed to fetch weather stations');
        }

        const data = await res.json();

        const locs: RouteLocation[] = (data.features || [])
          .map((feature: any) => {
            const lat = feature?.geometry?.coordinates?.[1];
            const lon = feature?.geometry?.coordinates?.[0];
            const name =
              feature?.properties?.name ||
              feature?.properties?.names?.fi ||
              'Unnamed station';

            return {
              id: String(feature.id),
              label: name,
              lat,
              lon,
            } as RouteLocation;
          })
          .filter(
            (loc: RouteLocation) =>
              typeof loc.lat === 'number' &&
              typeof loc.lon === 'number' &&
              !Number.isNaN(loc.lat) &&
              !Number.isNaN(loc.lon)
          );

        locs.sort((a, b) => a.label.localeCompare(b.label));
        const trimmed = locs.slice(0, 80);

        setRouteLocations(trimmed);

        if (trimmed.length > 0) {
          setFromLocationId(trimmed[0].id);
        }
        if (trimmed.length > 1) {
          setToLocationId(trimmed[1].id);
        } else if (trimmed.length === 1) {
          setToLocationId(trimmed[0].id);
        }
      } catch (err) {
        console.error('Error loading route locations:', err);
        setLocationsError('Unable to load Finnish road weather locations.');
      } finally {
        setLocationsLoading(false);
      }
    };

    loadLocations();
  }, []);

  const fromLocation = routeLocations.find((l) => l.id === fromLocationId) || null;
  const toLocation = routeLocations.find((l) => l.id === toLocationId) || null;
  const fromLabel = fromLocation?.label || 'From';
  const toLabel = toLocation?.label || 'To';

  useEffect(() => {
    if (!locationEnabled) {
      setFrictionData([]);
      setTrafficData([]);
      setChartsError(null);
      setChartsLoading(false);
      return;
    }

    if (!fromLocation || !toLocation) return;

    const load = async () => {
      try {
        setChartsLoading(true);
        setChartsError(null);

        const [fromForecast, toForecast] = await Promise.all([
          fetchForecastSeries(fromLocation.lat, fromLocation.lon),
          fetchForecastSeries(toLocation.lat, toLocation.lon),
        ]);

        const len = Math.min(fromForecast.length, toForecast.length);
        const newFriction: FrictionPoint[] = [];
        const newTraffic: TrafficPoint[] = [];

        for (let i = 0; i < len; i++) {
          const f = fromForecast[i];
          const t = toForecast[i];

          const timeLabel = new Date(f.time).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
          });

          const frictionFrom = estimateFriction(f.tempC, f.precipMm);
          const frictionTo = estimateFriction(t.tempC, t.precipMm);

          const volumeFrom = estimateTrafficImpact(f.tempC, f.precipMm);
          const volumeTo = estimateTrafficImpact(t.tempC, t.precipMm);

          newFriction.push({
            timeLabel,
            frictionFrom,
            frictionTo,
          });

          newTraffic.push({
            timeLabel,
            volumeFrom,
            volumeTo,
          });
        }

        setFrictionData(newFriction);
        setTrafficData(newTraffic);
      } catch (err) {
        console.error(err);
        setChartsError('Unable to load live forecast data for the selected route.');
      } finally {
        setChartsLoading(false);
      }
    };

    load();
  }, [fromLocationId, toLocationId, fromLocation, toLocation, locationEnabled]);

  const prediction = useMemo(() => {
    if (!locationEnabled) {
      return {
        riskLabel: 'Unknown',
        suggestion: 'Turn Location ON in Settings to see route predictions.',
        detail:
          'This prototype prediction uses weather-based friction and traffic impact along your route. It only runs when location is enabled.',
      };
    }

    if (frictionData.length === 0 || trafficData.length === 0) {
      return {
        riskLabel: 'Unknown',
        suggestion: 'Waiting for live forecast data…',
        detail:
          'Once the weather forecast is loaded, a simple route suggestion will appear here.',
      };
    }

    let index = 0;
    if (departureChoice === 'plus1') index = 1;
    if (departureChoice === 'plus2') index = 2;
    if (index >= frictionData.length) index = frictionData.length - 1;

    const frictionFrom = frictionData[index].frictionFrom ?? 4.8;
    const frictionTo = frictionData[index].frictionTo ?? 4.8;
    const volumeFrom = trafficData[index].volumeFrom ?? 5.0;
    const volumeTo = trafficData[index].volumeTo ?? 5.0;

    const frictionScore = (frictionFrom + frictionTo) / 2;
    const trafficScore = (volumeFrom + volumeTo) / 2;

    const riskValue = 10 - (frictionScore + trafficScore);

    let riskLabel: 'Low' | 'Medium' | 'High';
    let suggestion: string;
    let detail: string;

    if (riskValue < 1.5) {
      riskLabel = 'Low';
      suggestion = 'Conditions look good – travelling at the selected time is fine.';
      // detail =
      //   'Friction levels and traffic impact are both close to normal.';
    } else if (riskValue < 2.5) {
      riskLabel = 'Medium';
      suggestion = 'Consider a slightly earlier/later departure if you want extra safety.';
      detail =
        'Weather may cause some slipperiness or minor traffic slowdowns. Allow some buffer time.';
    } else {
      riskLabel = 'High';
      suggestion =
        'If possible, avoid this time or choose an alternative route / departure window.';
      detail =
        'The combination of low friction (icy/wet conditions) and weather-driven traffic impact looks significant.';
    }

    return { riskLabel, suggestion, detail };
  }, [departureChoice, frictionData, trafficData, locationEnabled]);

  return (
    <div
      className={`min-h-screen w-full px-4 sm:px-6 lg:px-10 py-4 transition-colors duration-500 text-[15px] sm:text-base ${theme === 'dark'
        ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800'
        : 'bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300'
        }`}
    >
      <div className="w-full max-w-[1400px] mx-auto space-y-4">
        <div className="mb-1">
          <h1
            className={`text-2xl sm:text-3xl font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
              }`}
          >
            Analytics & Route Prediction
          </h1>
          <p
            className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}
          >
            Compare two Finnish road weather stations and see how live weather affects
            friction, traffic, and a simple risk estimate for your departure time.
          </p>
        </div>


        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1.2fr)] gap-5 xl:gap-7">
          <div
            className={`rounded-2xl shadow-lg p-5 sm:p-6 hover:shadow-xl transition-all duration-300 h-full ${theme === 'dark'
              ? 'bg-gray-800'
              : 'bg-gray-100/80 backdrop-blur-sm'
              }`}
          >
            {locationEnabled ? (
              <>
                <div className="mb-6 sm:mb-7">
                  <h3
                    className={`text-base sm:text-lg font-semibold mb-3 sm:mb-3.5 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                      }`}
                  >
                    Road Friction vs Time ({temperatureLabelUnit}-based forecast)
                  </h3>
                  <p
                    className={`text-xs sm:text-[13px] mb-2.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}
                  >
                    Each line shows an estimated friction level for the next hours,
                    computed from live temperature and precipitation forecasts along your
                    selected route.
                  </p>

                  <div
                    className={`rounded-xl p-3 sm:p-4 ${theme === 'dark'
                      ? 'bg-gradient-to-br from-blue-900/30 to-indigo-900/30'
                      : 'bg-gradient-to-br from-blue-50 to-indigo-50'
                      }`}
                  >
                    {chartsLoading ? (
                      <div
                        className={`py-10 text-center text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}
                      >
                        Loading live forecast for {fromLabel} → {toLabel}…
                      </div>
                    ) : chartsError ? (
                      <div className="py-6 text-center text-sm text-red-500">
                        {chartsError}
                      </div>
                    ) : frictionData.length === 0 ? (
                      <div
                        className={`py-6 text-center text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}
                      >
                        No forecast points available for this route.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={frictionData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={theme === 'dark' ? '#374151' : '#e0e7ff'}
                          />
                          <XAxis
                            dataKey="timeLabel"
                            label={{
                              value: 'Time (next hours)',
                              position: 'insideBottom',
                              offset: -5,
                              style: {
                                fontWeight: 600,
                                fill: theme === 'dark' ? '#d1d5db' : '#4b5563',
                              },
                            }}
                            tick={{
                              fontSize: 11,
                              fill: theme === 'dark' ? '#d1d5db' : '#4b5563',
                            }}
                            stroke={theme === 'dark' ? '#6b7280' : '#9ca3af'}
                          />
                          <YAxis
                            label={{
                              value: 'Estimated Road Friction',
                              angle: -90,
                              position: 'insideLeft',
                              style: {
                                fontWeight: 600,
                                fill: theme === 'dark' ? '#d1d5db' : '#4b5563',
                              },
                            }}
                            domain={[4, 5.5]}
                            tick={{
                              fontSize: 11,
                              fill: theme === 'dark' ? '#d1d5db' : '#4b5563',
                            }}
                            stroke={theme === 'dark' ? '#6b7280' : '#9ca3af'}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: theme === 'dark' ? '#1f2937' : 'white',
                              color: theme === 'dark' ? '#f3f4f6' : '#111827',
                              border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'
                                }`,
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="frictionFrom"
                            name={`From: ${fromLabel}`}
                            stroke="#4f46e5"
                            strokeWidth={3}
                            dot={{ fill: '#4f46e5', r: 4, strokeWidth: 2, stroke: 'white' }}
                            activeDot={{ r: 6, strokeWidth: 2 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="frictionTo"
                            name={`To: ${toLabel}`}
                            stroke="#10b981"
                            strokeWidth={3}
                            dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: 'white' }}
                            activeDot={{ r: 6, strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div>
                  <h3
                    className={`text-base sm:text-lg font-semibold mb-3 sm:mb-3.5 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                      }`}
                  >
                    Traffic Volume vs Time (weather impact)
                  </h3>
                  <p
                    className={`text-xs sm:text-[13px] mb-2.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}
                  >
                    This chart uses a simple approximation: heavier rain, snow, and very
                    low temperatures slightly reduce the “effective” traffic volume along
                    the route.
                  </p>
                  <div
                    className={`rounded-xl p-3 sm:p-4 ${theme === 'dark'
                      ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30'
                      : 'bg-gradient-to-br from-purple-50 to-pink-50'
                      }`}
                  >
                    {chartsLoading ? (
                      <div
                        className={`py-8 text-center text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}
                      >
                        Updating traffic impact using live weather…
                      </div>
                    ) : chartsError ? (
                      <div className="py-6 text-center text-sm text-red-500">
                        {chartsError}
                      </div>
                    ) : trafficData.length === 0 ? (
                      <div
                        className={`py-6 text-center text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}
                      >
                        No traffic impact data available for this route.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={trafficData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={theme === 'dark' ? '#374151' : '#fce7f3'}
                          />
                          <XAxis
                            dataKey="timeLabel"
                            label={{
                              value: 'Time (next hours)',
                              position: 'insideBottom',
                              offset: -5,
                              style: {
                                fontWeight: 600,
                                fill: theme === 'dark' ? '#d1d5db' : '#4b5563',
                              },
                            }}
                            tick={{
                              fontSize: 11,
                              fill: theme === 'dark' ? '#d1d5db' : '#4b5563',
                            }}
                            stroke={theme === 'dark' ? '#6b7280' : '#9ca3af'}
                          />
                          <YAxis
                            label={{
                              value: 'Relative Traffic Volume',
                              angle: -90,
                              position: 'insideLeft',
                              style: {
                                fontWeight: 600,
                                fill: theme === 'dark' ? '#d1d5db' : '#4b5563',
                              },
                            }}
                            domain={[4, 5.5]}
                            tick={{
                              fontSize: 11,
                              fill: theme === 'dark' ? '#d1d5db' : '#4b5563',
                            }}
                            stroke={theme === 'dark' ? '#6b7280' : '#9ca3af'}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: theme === 'dark' ? '#1f2937' : 'white',
                              color: theme === 'dark' ? '#f3f4f6' : '#111827',
                              border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'
                                }`,
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="volumeFrom"
                            name={`From: ${fromLabel}`}
                            stroke="#a855f7"
                            strokeWidth={3}
                            dot={{ fill: '#a855f7', r: 4, strokeWidth: 2, stroke: 'white' }}
                            activeDot={{ r: 6, strokeWidth: 2 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="volumeTo"
                            name={`To: ${toLabel}`}
                            stroke="#f97316"
                            strokeWidth={3}
                            dot={{ fill: '#f97316', r: 4, strokeWidth: 2, stroke: 'white' }}
                            activeDot={{ r: 6, strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col h-full justify-center items-center text-center gap-3">
                <h2
                  className={`text-xl sm:text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'
                    }`}
                >
                  Analytics and Trends are disabled
                </h2>
                <p
                  className={`text-sm max-w-md ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}
                >
                  To view route-based analytics, live friction/traffic charts, and route
                  prediction, turn <span className="font-semibold">Location</span> ON in
                  the Settings modal in the header.
                </p>
                <p
                  className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                    }`}
                >
                  This keeps the prototype consistent with the main dashboard: we only
                  show context-aware analytics when location usage is explicitly enabled.
                </p>
              </div>
            )}
          </div>

          <div
            className={`rounded-2xl shadow-lg p-5 sm:p-6 hover:shadow-xl transition-all duration-300 h-full ${theme === 'dark'
              ? 'bg-gray-800'
              : 'bg-gray-100/80 backdrop-blur-sm'
              }`}
          >
            {locationEnabled ? (
              <>
                <h2
                  className={`text-xl sm:text-2xl font-bold mb-4 sm:mb-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'
                    }`}
                >
                  Route selection
                </h2>

                <div
                  className={`mb-5 rounded-2xl border px-4 py-4 sm:px-5 sm:py-4 flex flex-col gap-3 ${theme === 'dark'
                    ? 'bg-gradient-to-r from-slate-900/70 via-slate-800/80 to-slate-900/70 border-slate-700'
                    : 'bg-gradient-to-r from-white via-slate-100 to-white border-slate-200'
                    }`}
                >
                  <div className="flex-1">
                    <h3
                      className={`text-sm sm:text-base font-semibold mb-1 ${theme === 'dark' ? 'text-slate-50' : 'text-slate-800'
                        }`}
                    >
                      Route prediction
                    </h3>
                    <p
                      className={`text-xs sm:text-[13px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                        }`}
                    >
                      Based on the selected <span className="font-semibold">From</span> and{' '}
                      <span className="font-semibold">To</span> stations and the chosen
                      departure window. It combines live weather-based friction and a
                      simple traffic impact estimate.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <div>
                      <label
                        className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                          }`}
                      >
                        Departure window
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setDepartureChoice('now')}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border ${departureChoice === 'now'
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : theme === 'dark'
                              ? 'bg-slate-800 text-slate-200 border-slate-600'
                              : 'bg-white text-slate-700 border-slate-300'
                            }`}
                        >
                          Now
                        </button>
                        <button
                          type="button"
                          onClick={() => setDepartureChoice('plus1')}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border ${departureChoice === 'plus1'
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : theme === 'dark'
                              ? 'bg-slate-800 text-slate-200 border-slate-600'
                              : 'bg-white text-slate-700 border-slate-300'
                            }`}
                        >
                          +1 hour
                        </button>
                        <button
                          type="button"
                          onClick={() => setDepartureChoice('plus2')}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border ${departureChoice === 'plus2'
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : theme === 'dark'
                              ? 'bg-slate-800 text-slate-200 border-slate-600'
                              : 'bg-white text-slate-700 border-slate-300'
                            }`}
                        >
                          +2 hours
                        </button>
                      </div>
                    </div>

                    <div className="min-w-[200px]">
                      <p
                        className={`text-xs uppercase tracking-wide mb-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                          }`}
                      >
                        Risk level
                      </p>
                      <p
                        className={`text-sm font-semibold ${prediction.riskLabel === 'High'
                          ? 'text-rose-500'
                          : prediction.riskLabel === 'Medium'
                            ? 'text-amber-500'
                            : 'text-emerald-600'
                          }`}
                      >
                        {prediction.riskLabel}
                      </p>
                      <p
                        className={`mt-1 text-xs ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                          }`}
                      >
                        {prediction.suggestion}
                      </p>
                    </div>
                  </div>

                  <p
                    className={`mt-1 text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}
                  >
                    {prediction.detail}
                  </p>
                </div>

                <div
                  className={`mb-4 rounded-xl border px-4 py-4 sm:px-5 sm:py-4 ${theme === 'dark'
                    ? 'bg-slate-900/70 border-slate-700'
                    : 'bg-white border-slate-200'
                    }`}
                >
                  <h3
                    className={`text-sm sm:text-base font-semibold mb-2 ${theme === 'dark' ? 'text-slate-50' : 'text-slate-800'
                      }`}
                  >
                    How this prediction works
                  </h3>
                  <ol
                    className={`list-decimal ml-4 text-xs sm:text-[13px] space-y-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                      }`}
                  >
                    <li>
                      <span className="font-semibold">From</span> and{' '}
                      <span className="font-semibold">To</span> are loaded from{' '}
                      <span className="font-semibold">Digitraffic</span> road weather
                      stations (real locations in Finland).
                    </li>
                    <li>
                      For both points, we query{' '}
                      <span className="font-semibold">Open-Meteo</span> for the next
                      hours of <span className="font-semibold">temperature</span> and{' '}
                      <span className="font-semibold">precipitation</span>.
                    </li>
                    <li>
                      A small rule-based “model” converts that weather into{' '}
                      <span className="font-semibold">estimated friction</span> and{' '}
                      <span className="font-semibold">weather-driven traffic impact</span>.
                    </li>
                    <li>
                      The charts show these estimates over time for{' '}
                      <span className="font-semibold">{fromLabel}</span> (blue/purple) and{' '}
                      <span className="font-semibold">{toLabel}</span> (green/orange).
                    </li>
                    <li>
                      The <span className="font-semibold">Route prediction</span>{' '}
                      card above reads one time step (Now / +1h / +2h) and classifies the
                      overall risk as Low / Medium / High.
                    </li>
                  </ol>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <label
                      className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}
                    >
                      From station
                    </label>
                    <select
                      value={fromLocationId}
                      onChange={(e) => setFromLocationId(e.target.value)}
                      disabled={locationsLoading || routeLocations.length === 0}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-gray-100'
                        : 'bg-white border-gray-300 text-gray-900'
                        }`}
                    >
                      {locationsLoading && <option>Loading locations…</option>}
                      {!locationsLoading && routeLocations.length === 0 && (
                        <option>No locations available</option>
                      )}
                      {!locationsLoading &&
                        routeLocations.length > 0 &&
                        routeLocations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.label}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label
                      className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}
                    >
                      To station
                    </label>
                    <select
                      value={toLocationId}
                      onChange={(e) => setToLocationId(e.target.value)}
                      disabled={locationsLoading || routeLocations.length === 0}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-gray-100'
                        : 'bg-white border-gray-300 text-gray-900'
                        }`}
                    >
                      {locationsLoading && <option>Loading locations…</option>}
                      {!locationsLoading && routeLocations.length === 0 && (
                        <option>No locations available</option>
                      )}
                      {!locationsLoading &&
                        routeLocations.length > 0 &&
                        routeLocations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.label}
                          </option>
                        ))}
                    </select>
                  </div>

                  {locationsError && (
                    <div className="mt-1 text-xs text-red-500">{locationsError}</div>
                  )}

                  <div
                    className={`mt-2 rounded-lg px-3 py-2 text-[11px] ${theme === 'dark'
                      ? 'bg-slate-900/70 text-slate-300 border border-slate-700'
                      : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                  >
                    <p>
                      <span className="font-semibold">Info:</span> Try selecting two
                      different regions (e.g. a coastal station and an inland station) –
                      the friction and traffic curves will separate when weather differs
                      between them.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col h-full justify-center items-center text-center gap-3">
                <h2
                  className={`text-xl sm:text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'
                    }`}
                >
                  Route selection hidden
                </h2>
                <p
                  className={`text-sm max-w-md ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}
                >
                  From / To station selection and the route explanation use live
                  geolocated data. To keep behaviour consistent with the main dashboard,
                  they are only available when{' '}
                  <span className="font-semibold">Location</span> is turned ON in
                  Settings.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsandTrends;