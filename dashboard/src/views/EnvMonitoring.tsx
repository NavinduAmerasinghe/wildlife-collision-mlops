//TrafficWeatherDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Info, Sun, Cloud, CloudRain, CloudSnow, Wind, Loader } from 'lucide-react';
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useSettings } from './SettingsContext';
import { classifyRoadType, RoadType } from './roadTypeUtils';
import {
  WeatherData,
  Alert,
  CameraStation,
  CameraPreset,
  RoadWeatherStation,
  FmiPointData,
  ToastType
} from '../types/TrafficWeather'
import { useTrafficState } from '../redux/storeHooks';

const getFinnishRegionForCoordinates = (lat: number, lon: number): string | null => {
  if (lat >= 59.75 && lat <= 60.70 && lon >= 23.00 && lon <= 26.30) {
    return 'Uusimaa';
  }
  if (lat >= 60.00 && lat <= 61.70 && lon >= 21.00 && lon <= 23.80) {
    return 'Varsinais-Suomi';
  }
  if (lat >= 60.80 && lat <= 62.50 && lon >= 21.00 && lon <= 23.50) {
    return 'Satakunta';
  }
  if (lat >= 60.60 && lat <= 61.40 && lon >= 23.50 && lon <= 25.50) {
    return 'Kanta-Häme';
  }
  if (lat >= 60.70 && lat <= 61.80 && lon >= 25.00 && lon <= 26.30) {
    return 'Päijät-Häme';
  }
  if (lat >= 60.80 && lat <= 62.30 && lon >= 22.50 && lon <= 24.80) {
    return 'Pirkanmaa';
  }
  if (lat >= 60.40 && lat <= 61.30 && lon >= 26.00 && lon <= 28.00) {
    return 'Kymenlaakso';
  }
  if (lat >= 60.70 && lat <= 61.80 && lon >= 27.50 && lon <= 30.00) {
    return 'Etelä-Karjala';
  }
  if (lat >= 61.20 && lat <= 62.50 && lon >= 26.00 && lon <= 29.00) {
    return 'Etelä-Savo';
  }
  if (lat >= 62.40 && lat <= 63.80 && lon >= 26.00 && lon <= 28.50) {
    return 'Pohjois-Savo';
  }
  if (lat >= 61.80 && lat <= 63.40 && lon >= 28.50 && lon <= 31.80) {
    return 'Pohjois-Karjala';
  }
  if (lat >= 61.70 && lat <= 63.50 && lon >= 24.00 && lon <= 26.50) {
    return 'Keski-Suomi';
  }
  if (lat >= 62.00 && lat <= 63.80 && lon >= 21.00 && lon <= 23.00) {
    return 'Etelä-Pohjanmaa';
  }
  if (lat >= 62.80 && lat <= 64.00 && lon >= 21.00 && lon <= 22.80) {
    return 'Pohjanmaa';
  }
  if (lat >= 63.20 && lat <= 64.30 && lon >= 22.00 && lon <= 25.00) {
    return 'Keski-Pohjanmaa';
  }
  if (lat >= 64.00 && lat <= 66.60 && lon >= 23.50 && lon <= 28.50) {
    return 'Pohjois-Pohjanmaa';
  }
  if (lat >= 64.00 && lat <= 66.80 && lon >= 27.00 && lon <= 30.00) {
    return 'Kainuu';
  }
  if (lat >= 66.00 && lat <= 70.10 && lon >= 20.00 && lon <= 30.00) {
    return 'Lappi';
  }
  if (lat >= 59.75 && lat <= 60.60 && lon >= 19.80 && lon <= 21.20) {
    return 'Ahvenanmaa';
  }
  return null;
};

/* c8 ignore start */
const fetchFmiAlertsForRegion = async (regionName: string): Promise<Alert[]> => {
  try {
    const response = await fetch('https://alerts.fmi.fi/cap/feed/atom_en-GB.xml');
    if (!response.ok) {
      throw new Error('Failed to fetch FMI alerts');
    }

    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'application/xml');

    const entries = Array.from(xml.getElementsByTagName('entry'));
    const regionAlerts: Alert[] = [];
    const allAlerts: Alert[] = [];

    const regionLower = regionName.toLowerCase();

    for (const entry of entries) {
      const contentNode = entry.getElementsByTagName('content')[0];
      if (!contentNode) continue;

      const alertNode =
        contentNode.getElementsByTagName('alert')[0] ||
        contentNode.getElementsByTagName('cap:alert')[0];
      if (!alertNode) continue;

      const infoNodes = alertNode.getElementsByTagName('info');
      if (!infoNodes || infoNodes.length === 0) continue;

      let chosenInfo: Element | null = null;
      for (const info of Array.from(infoNodes)) {
        const langNode = info.getElementsByTagName('language')[0];
        const lang = langNode?.textContent?.trim();
        if (lang === 'en-GB') {
          chosenInfo = info;
          break;
        }
      }
      if (!chosenInfo) chosenInfo = infoNodes[0];
      if (!chosenInfo) continue;

      const severityText = chosenInfo.getElementsByTagName('severity')[0]?.textContent?.trim() || '';
      const eventText = chosenInfo.getElementsByTagName('event')[0]?.textContent?.trim() || '';
      const headlineText = chosenInfo.getElementsByTagName('headline')[0]?.textContent?.trim() || '';
      const descriptionText =
        chosenInfo.getElementsByTagName('description')[0]?.textContent?.trim() || '';

      let eventCode: string | undefined;
      const parameterNodes = chosenInfo.getElementsByTagName('parameter');
      for (const param of Array.from(parameterNodes)) {
        const valueName = param.getElementsByTagName('valueName')[0]?.textContent || '';
        const value = param.getElementsByTagName('value')[0]?.textContent || '';
        if (valueName === 'eventCode') {
          eventCode = value;
          break;
        }
      }

      const areaNodes = chosenInfo.getElementsByTagName('area');
      let coversRegion = false;

      for (const area of Array.from(areaNodes)) {
        const areaDescNode = area.getElementsByTagName('areaDesc')[0];
        const areaDesc = (areaDescNode?.textContent || '').trim();
        if (!areaDesc) continue;

        const areaLower = areaDesc.toLowerCase();
        if (areaLower.includes(regionLower)) {
          coversRegion = true;
        }
      }

      let color: 'red' | 'yellow' | 'green' = 'yellow';
      const sevLower = severityText.toLowerCase();
      if (sevLower === 'extreme' || sevLower === 'severe') color = 'red';
      else if (sevLower === 'minor') color = 'green';

      const pieces: string[] = [];
      if (eventText) pieces.push(eventText);
      if (headlineText && headlineText !== eventText) pieces.push(headlineText);
      if (descriptionText) pieces.push(descriptionText);

      const fullText = pieces.join(' – ');
      const trimmedText = fullText.length > 300 ? fullText.slice(0, 297) + '...' : fullText;

      const alertObj: Alert = {
        color,
        text: trimmedText || `Weather warning (${regionName})`,
        severity: severityText || 'unknown',
        eventCode,
        eventName: eventText || headlineText || 'Weather warning',
      };

      allAlerts.push(alertObj);
      if (coversRegion) {
        regionAlerts.push(alertObj);
      }
    }

    console.log(
      `FMI alerts: total=${allAlerts.length}, matching region '${regionName}'=${regionAlerts.length}`
    );

    if (regionAlerts.length > 0) {
      return regionAlerts;
    }

    return allAlerts;
  } catch (err) {
    console.error('Error fetching/parsing FMI alerts:', err);
    return [];
  }
};

const fetchFmiPointForecast = async (lat: number, lon: number): Promise<FmiPointData | null> => {
  try {
    const snap = (n: number) => Math.round(n / 0.025) * 0.025;

    const url =
      `https://opendata.fmi.fi/wfs?` +
      `service=WFS&version=2.0.0&request=GetFeature&` +
      `storedquery_id=fmi::forecast::meps::surface::point::simple&` +
      `latlon=${snap(lat)},${snap(lon)}&` +
      `parameters=temperature,windspeedms,WeatherSymbol3`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error('FMI WFS response not OK:', response.status, response.statusText);
      throw new Error('Failed to fetch FMI point forecast');
    }

    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'application/xml');

    const exception = xml.getElementsByTagName('ows:ExceptionText')[0];
    if (exception) {
      console.error('FMI ServiceException:', exception.textContent);
      return null;
    }

    const elements =
      Array.from(xml.getElementsByTagName('BsWfs:BsWfsElement')) ??
      Array.from(xml.getElementsByTagName('BsWfsElement'));

    if (elements.length === 0) {
      console.warn('No BsWfs:BsWfsElement in FMI MEPS response');
      return null;
    }

    let latestTemperature: number | undefined;
    let latestWindSpeed: number | undefined;
    let latestPhenomenonCode: string | undefined;
    let latestTime: string | undefined;

    for (const el of elements) {
      const nameNode =
        el.getElementsByTagName('BsWfs:ParameterName')[0] ||
        el.getElementsByTagName('ParameterName')[0];
      const valueNode =
        el.getElementsByTagName('BsWfs:ParameterValue')[0] ||
        el.getElementsByTagName('ParameterValue')[0];
      const timeNode =
        el.getElementsByTagName('BsWfs:Time')[0] || el.getElementsByTagName('Time')[0];

      const paramName = nameNode?.textContent || '';
      const paramValue = valueNode?.textContent || '';
      const time = timeNode?.textContent || '';

      if (!paramName || !paramValue) continue;

      if (paramName === 'temperature') {
        latestTemperature = parseFloat(paramValue);
        latestTime = time;
      } else if (paramName === 'windspeedms') {
        latestWindSpeed = parseFloat(paramValue);
        latestTime = time;
      } else if (paramName === 'WeatherSymbol3') {
        latestPhenomenonCode = paramValue;
        latestTime = time;
      }
    }

    if (
      latestTemperature === undefined &&
      latestWindSpeed === undefined &&
      latestPhenomenonCode === undefined
    ) {
      console.warn('FMI MEPS point forecast: no usable parameters for this location');
      return null;
    }

    return {
      temperature: latestTemperature,
      windSpeed: latestWindSpeed,
      phenomenonCode: latestPhenomenonCode,
      timestamp: latestTime,
    };
  } catch (err) {
    console.error('Error fetching/parsing FMI MEPS point forecast:', err);
    return null;
  }
};

const InfoTooltip: React.FC<{ text: string }> = ({ text }) => (
  <span className="relative inline-flex ml-1 group">
    <Info className="w-4 h-4 text-slate-400 cursor-pointer" />
    <span className="pointer-events-none absolute z-30 top-6 right-0 w-64 rounded-lg bg-slate-900/95 border border-slate-700 px-3 py-2 text-[11px] leading-relaxed text-slate-100 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
      {text}
    </span>
  </span>
);

const TrafficWeatherDashboard: React.FC = () => {
  const { theme, temperatureUnit, notificationType, locationEnabled } = useSettings();

  const [searchLocation, setSearchLocation] = useTrafficState('searchLocation')
  const [selectedCamera, setSelectedCamera] = useTrafficState('selectedCamera')
  const [roadType, setRoadType] = useTrafficState('roadType')

  const [conditions, setConditions] = useTrafficState('conditions')
  const [weatherData, setWeatherData] = useTrafficState('weatherData')
  const [alerts, setAlerts] = useTrafficState('alerts')
  const [loading, setLoading] = useState(true);
  const [error, setError] = useTrafficState('error')
  const [currentTempC, setCurrentTempC] = useTrafficState('currentTempC')

  const [cameraStations, setCameraStations] = useTrafficState('cameraStations')
  const [cameraPresets, setCameraPresets] = useTrafficState('cameraPresets')
  const [currentCameraImage, setCurrentCameraImage] = useTrafficState('currentCameraImage')
  const [cameraLoading, setCameraLoading] = useState(false);
  const [lastImageUpdate, setLastImageUpdate] = useTrafficState('lastImageUpdate')
  const [selectedCameraLocation, setSelectedCameraLocation] = useTrafficState('selectedCameraLocation')
  const [nearestWeatherStation, setNearestWeatherStation] = useTrafficState('nearestWeatherStation')
  const [selectedRegion, setSelectedRegion] = useTrafficState('selectedRegion')
  const [fmiPointData, setFmiPointData] = useTrafficState('fmiPointData')
  const [selectedAlertType, setSelectedAlertType] = useTrafficState('selectedAlertType')
  const [toast, setToast] = useTrafficState('toast')
  const [lastDetectedCondition, setLastDetectedCondition] = useTrafficState('lastDetectedCondition')
  const [cameraSort, setCameraSort] = useTrafficState('cameraSort')

  const unitSymbol = temperatureUnit === 'celsius' ? '°C' : '°F';

  const formatTemp = (tempC?: number | null): string => {
    if (tempC === undefined || tempC === null || isNaN(tempC)) return '-';
    if (temperatureUnit === 'celsius') return `${Math.round(tempC)}°C`;
    return `${Math.round((tempC * 9) / 5 + 32)}°F`;
  };

  const convertTempNumber = (tempC: number): number =>
    temperatureUnit === 'celsius' ? tempC : (tempC * 9) / 5 + 32;

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(toast?.message === message ? null : toast);
    }, 4000);
  };

  type NotificationChannelKey = 'push' | 'toast' | 'email';

  type NotificationHandler = (
    message: string,
    showToast: (msg: string, type?: ToastType) => void
  ) => Promise<void>;

  const notificationStrategies: Record<NotificationChannelKey, NotificationHandler> = {
    push: async (message, showToast) => {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        // Fallback if Notifications are not supported
        showToast(message, 'info');
        return;
      }

      if (Notification.permission === 'granted') {
        new Notification('Live camera updated', { body: message });
      } else {
        // If not granted, just use in-dashboard toast
        showToast(
          'Browser has blocked or not granted push notifications. Showing message in the dashboard instead.',
          'warning'
        );
        showToast(message, 'success');
      }
    },

    toast: async (message, showToast) => {
      showToast(message, 'success');
    },

    email: async (message, showToast) => {
      try {
        const res = await fetch('http://localhost:8080/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: 'an.cao@tuni.fi',
            subject: 'Smart Road Weather Dashboard notification',
            body: message,
          }),
        });

        if (!res.ok) {
          throw new Error(`Email API error: ${res.status}`);
        }

        showToast('Notification sent via email.', 'success');
      } catch (err) {
        console.error('Error sending email notification', err);
        showToast(
          'Could not send email notification. Check the email service.',
          'warning'
        );
      }
    },
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchNearestWeatherStation = async (lat: number, lon: number, regionName?: string) => {
    try {
      const stationsResponse = await fetch('https://tie.digitraffic.fi/api/weather/v1/stations', {
        headers: {
          'Digitraffic-User': 'TrafficWeatherDashboard/1.0',
          'Accept-Encoding': 'gzip',
        },
      });

      if (!stationsResponse.ok) {
        throw new Error('Failed to fetch weather stations');
      }

      const stationsData = await stationsResponse.json();

      let nearestStation: RoadWeatherStation | null = null;
      let minDistance = Infinity;

      stationsData.features.forEach((feature: any) => {
        const stationLat = feature.geometry.coordinates[1];
        const stationLon = feature.geometry.coordinates[0];
        const distance = calculateDistance(lat, lon, stationLat, stationLon);

        if (distance < minDistance) {
          minDistance = distance;
          nearestStation = {
            id: String(feature.id),
            name: feature.properties.name || feature.properties?.names?.fi || 'Unknown',
            lat: stationLat,
            lon: stationLon,
          };
        }
      });

      if (nearestStation) {
        const weatherResponse = await fetch(
          `https://tie.digitraffic.fi/api/weather/v1/stations/${nearestStation.id}/data`,
          {
            headers: {
              'Digitraffic-User': 'TrafficWeatherDashboard/1.0',
              'Accept-Encoding': 'gzip',
            },
          }
        );

        if (weatherResponse.ok) {
          const weatherData = await weatherResponse.json();

          const sensorData: Record<string, number> = {};
          if (weatherData.sensorValues) {
            weatherData.sensorValues.forEach((sensor: any) => {
              if (typeof sensor.sensorValue === 'number') {
                sensorData[sensor.name] = sensor.sensorValue;
              }
            });
          }

          const stationWithWeather: RoadWeatherStation = {
            ...nearestStation,
            roadTemperature: sensorData['TIE_1'] ?? sensorData['ILMA'],
            airTemperature: sensorData['ILMA'],
            windSpeed: sensorData['TUULI'] ?? sensorData['KESKITUULI'],
            humidity: sensorData['KOSTEUS'],
            precipitation: sensorData['SADEMAARA_1H'],
            visibility: sensorData['NÄKYVYYS'],
          };

          setNearestWeatherStation(stationWithWeather);

          const region =
            regionName ||
            getFinnishRegionForCoordinates(stationWithWeather.lat, stationWithWeather.lon);

          setSelectedRegion(region || null);

          if (region) {
            const fmiAlerts = await fetchFmiAlertsForRegion(region);
            setAlerts(fmiAlerts);
            setSelectedAlertType('all');
            showToast(
              `Updated FMI alerts for ${region} (${fmiAlerts.length} active warning${fmiAlerts.length === 1 ? '' : 's'
              }).`,
              'info'
            );
          } else {
            setAlerts([]);
          }

          const pointData = await fetchFmiPointForecast(
            stationWithWeather.lat,
            stationWithWeather.lon
          );
          setFmiPointData(pointData);
        }
      }
    } catch (err) {
      console.error('Error fetching weather station data:', err);
    }
  };

  const fetchCameraStations = async () => {
    try {
      const response = await fetch('https://tie.digitraffic.fi/api/weathercam/v1/stations', {
        headers: {
          'Digitraffic-User': 'TrafficWeatherDashboard/1.0',
          'Accept-Encoding': 'gzip',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch camera stations');
      }

      const data = await response.json();

      const stations: CameraStation[] = data.features
        .filter(
          (feature: any) =>
            feature.properties.presets && feature.properties.presets.length > 0
        )
        .map((feature: any) => ({
          id: String(feature.id),
          name: feature.properties.name || feature.properties.names?.fi || 'Unknown',
          lat: feature.geometry.coordinates[1],
          lon: feature.geometry.coordinates[0],
          presets: feature.properties.presets.map((preset: any) => ({
            id: String(preset.id),
            presentationName: preset.presentationName || 'Camera View',
            imageUrl: `https://weathercam.digitraffic.fi/${preset.id}.jpg`,
            stationId: String(feature.id),
          })),
        }))
        .slice(0, 200);

      setCameraStations(stations);

      const allPresets: CameraPreset[] = [];
      stations.forEach((station) => {
        station.presets.forEach((preset) => {
          allPresets.push({
            ...preset,
            presentationName: `${station.name} - ${preset.presentationName}`,
          });
        });
      });

      setCameraPresets(allPresets);

      if (allPresets.length > 0) {
        setSelectedCamera(allPresets[0].id);
      }
    } catch (err) {
      console.error('Error fetching camera stations:', err);
    }
  };

  const loadCameraImage = async (cameraId: string) => {
    if (!cameraId) return;

    setCameraLoading(true);
    try {
      const imageUrl = `https://weathercam.digitraffic.fi/${cameraId}.jpg?t=${Date.now()}`;
      setCurrentCameraImage(imageUrl);
      setLastImageUpdate(new Date());
    } catch (err) {
      console.error('Error loading camera image:', err);
    } finally {
      setCameraLoading(false);
    }
  };

  const fetchWeatherData = async (location: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=61.4978&longitude=23.7610&current=temperature_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&timezone=auto&forecast_days=1`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const data = await response.json();

      setCurrentTempC(data.current.temperature_2m);

      const currentHour = new Date().getHours();
      const forecastData: WeatherData[] = [];

      for (let i = 0; i < 4; i++) {
        const hourIndex = currentHour + i;
        if (hourIndex < data.hourly.temperature_2m.length) {
          const tempC = Math.round(data.hourly.temperature_2m[hourIndex]);
          const weatherCode = data.hourly.weather_code[hourIndex];
          const time = new Date(data.hourly.time[hourIndex]);

          forecastData.push({
            temp: `${tempC}°C`,
            tempValue: tempC,
            time: time.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }),
            condition: getWeatherCondition(weatherCode),
            icon: getWeatherIcon(weatherCode),
          });
        }
      }

      setWeatherData(forecastData);
    } catch (err) {
      setError('Unable to fetch weather data');
      console.error(err);
      setWeatherData([
        { temp: '18°C', time: '12:00', condition: 'Clear', icon: 'sun', tempValue: 18 },
        { temp: '18°C', time: '13:00', condition: 'Clear', icon: 'sun', tempValue: 18 },
        { temp: '19°C', time: '14:00', condition: 'Clear', icon: 'sun', tempValue: 19 },
        { temp: '19°C', time: '15:00', condition: 'Clear', icon: 'sun', tempValue: 19 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    if (!('Notification' in window)) return false;

    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;

    const result = await Notification.requestPermission();
    return result === 'granted';
  };

  const sendCameraUpdateNotification = async () => {
    const stationName = nearestWeatherStation?.name;
    const message = stationName
      ? `Live camera near ${stationName} was refreshed.`
      : 'The live camera image was refreshed.';

    const key: NotificationChannelKey =
      notificationType === 'push'
        ? 'push'
        : notificationType === 'email'
          ? 'email'
          : 'toast';

    await notificationStrategies[key](message, showToast);
  };

  const sendConditionChangeNotification = async (message: string) => {
    const key: NotificationChannelKey =
      notificationType === 'push'
        ? 'push'
        : notificationType === 'email'
          ? 'email'
          : 'toast';

    await notificationStrategies[key](message, showToast);
  };

  const handleCameraReloadClick = async () => {
    if (!selectedCamera) return;

    await loadCameraImage(selectedCamera);

    const station = cameraStations.find((s) =>
      s.presets.some((p) => p.id === selectedCamera)
    );

    if (station) {
      const regionFromCamera = getFinnishRegionForCoordinates(station.lat, station.lon);
      await fetchNearestWeatherStation(
        station.lat,
        station.lon,
        regionFromCamera || undefined
      );
    }

    await sendCameraUpdateNotification();
  };


  const getWeatherCondition = (code: number): string => {
    if (code === 0) return 'Clear';
    if (code <= 3) return 'Partly Cloudy';
    if (code <= 48) return 'Foggy';
    if (code <= 67) return 'Rainy';
    if (code <= 77) return 'Snowy';
    if (code <= 82) return 'Rain Showers';
    return 'Stormy';
  };

  const getWeatherIcon = (code: number): string => {
    if (code === 0) return 'sun';
    if (code <= 3) return 'cloud';
    if (code <= 67) return 'rain';
    if (code <= 77) return 'snow';
    return 'wind';
  };

  const renderWeatherIcon = (iconType: string) => {
    switch (iconType) {
      case 'sun':
        return <Sun className="w-8 h-8 text-amber-300" />;
      case 'cloud':
        return <Cloud className="w-8 h-8 text-slate-300" />;
      case 'rain':
        return <CloudRain className="w-8 h-8 text-sky-300" />;
      case 'snow':
        return <CloudSnow className="w-8 h-8 text-cyan-200" />;
      case 'wind':
        return <Wind className="w-8 h-8 text-slate-300" />;
      default:
        return <Sun className="w-8 h-8 text-amber-300" />;
    }
  };

  const handleLocationSearch = () => {
    fetchWeatherData(searchLocation);
    showToast(
      `Location search applied. Cameras and alerts are filtered using "${searchLocation || 'N/A'}".`,
      'info'
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLocationSearch();
    }
  };

  const getDetectedCondition = (): 'Icy' | 'Snowy' | 'Wet' | 'Clear' | null => {
    if (!nearestWeatherStation && !fmiPointData) return null;

    const roadTemp = nearestWeatherStation?.roadTemperature;
    const precip = nearestWeatherStation?.precipitation;
    const phenomenonCode = fmiPointData?.phenomenonCode
      ? parseInt(fmiPointData.phenomenonCode, 10)
      : undefined;

    if (roadTemp !== undefined && roadTemp <= 0) {
      if (phenomenonCode && phenomenonCode >= 70 && phenomenonCode <= 82) {
        return 'Snowy';
      }
      return 'Icy';
    }

    if (precip !== undefined && precip > 0) {
      if (phenomenonCode && phenomenonCode >= 70 && phenomenonCode <= 82) {
        return 'Snowy';
      }
      return 'Wet';
    }

    return 'Clear';
  };

  const alertMatchesCondition = (alert: Alert, cond: 'Icy' | 'Clear' | 'Wet' | 'Snowy'): boolean => {
    if (cond === 'Clear') {
      return true;
    }

    const text = ((alert.text || '') + ' ' + (alert.eventName || '')).toLowerCase();

    if (cond === 'Icy') {
      return (
        text.includes('ice') ||
        text.includes('icy') ||
        text.includes('slippery') ||
        text.includes('freezing')
      );
    }
    if (cond === 'Snowy') {
      return (
        text.includes('snow') ||
        text.includes('blizzard') ||
        text.includes('snowfall') ||
        text.includes('snowstorm')
      );
    }
    if (cond === 'Wet') {
      return (
        text.includes('rain') ||
        text.includes('shower') ||
        text.includes('thunderstorm') ||
        text.includes('flood') ||
        text.includes('wet')
      );
    }

    return true;
  };

  const getFilteredCameraPresets = (): CameraPreset[] => {
    const locTerm = searchLocation.trim().toLowerCase();

    const filtered = cameraPresets.filter((preset) => {
      const text = preset.presentationName.toLowerCase();

      const station = cameraStations.find((s) => s.id === preset.stationId);
      const stationType = station ? classifyRoadType(station.name) : 'Local Roads';

      const matchesRoadType = stationType === roadType;
      const matchesLocation = locTerm === '' ? true : text.includes(locTerm);

      return matchesRoadType && matchesLocation;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (cameraSort === 'name') {
        return a.presentationName.localeCompare(b.presentationName);
      }
      return a.id.localeCompare(b.id);
    });

    return sorted;
  };

  const filteredCameraPresets = getFilteredCameraPresets();
  const detectedCondition = getDetectedCondition();
  const noCamerasMatchFilters =
    cameraPresets.length > 0 && filteredCameraPresets.length === 0;

  useEffect(() => {
    fetchWeatherData(searchLocation);
    fetchCameraStations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    if (selectedCamera && cameraStations.length > 0) {
      loadCameraImage(selectedCamera);

      const station = cameraStations.find((s) =>
        s.presets.some((p) => p.id === selectedCamera)
      );

      if (station) {
        setSelectedCameraLocation({ lat: station.lat, lon: station.lon });

        const regionFromCamera = getFinnishRegionForCoordinates(station.lat, station.lon);
        setSelectedRegion(regionFromCamera || null);

        fetchNearestWeatherStation(station.lat, station.lon, regionFromCamera || undefined);
      }

      const interval = setInterval(() => {
        loadCameraImage(selectedCamera);
      }, 60000);

      return () => clearInterval(interval);
    } else {
      setNearestWeatherStation(null);
      setSelectedCameraLocation(null);
      setSelectedRegion(null);
      setAlerts([]);
      setFmiPointData(null);
      setSelectedAlertType('all');
      setCurrentCameraImage('');
    }
  }, [selectedCamera, cameraStations]);

  useEffect(() => {
    const filtered = getFilteredCameraPresets();

    if (filtered.length === 0) {
      if (selectedCamera !== '') {
        setSelectedCamera('');
      }
      if (cameraPresets.length > 0) {
        showToast(
          'No cameras match the current filters. Try another road type or clear the search fields.',
          'warning'
        );
      }
    } else if (!filtered.some((p) => p.id === selectedCamera)) {
      setSelectedCamera(filtered[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchLocation, cameraPresets, roadType, cameraSort]);

  useEffect(() => {
    if (!detectedCondition) return;

    if (lastDetectedCondition !== detectedCondition) {
      if (lastDetectedCondition) {
        const message = `Detected road condition near ${nearestWeatherStation?.name || 'the selected camera'
          } updated: ${detectedCondition}.`;

        // Use the same strategy system (push / email / toast)
        sendConditionChangeNotification(message);
      }
      setLastDetectedCondition(detectedCondition);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedCondition]);

  const alertTypeOptions = Array.from(
    new Map(
      alerts.map((a) => {
        const value = a.eventCode || a.eventName || 'other';
        const label = a.eventName || a.eventCode || 'Other';
        return [value, label];
      })
    ).entries()
  );

  const alertsFilteredByType = alerts.filter((alert) => {
    if (selectedAlertType === 'all') return true;
    const value = alert.eventCode || alert.eventName;
    return value === selectedAlertType;
  });

  const alertsFilteredByTypeAndCondition = alertsFilteredByType.filter((alert) =>
    alertMatchesCondition(alert, conditions)
  );

  const alertsToShow =
    alertsFilteredByTypeAndCondition.length > 0
      ? alertsFilteredByTypeAndCondition
      : alertsFilteredByType.length > 0
        ? alertsFilteredByType
        : alerts;

  const defaultAlert: Alert = {
    color: 'green',
    severity: 'info',
    eventName: 'No active FMI warnings',
    text:
      'There are currently no active FMI weather warnings for this region. Normal caution is still advised while driving.',
  };

  const displayAlerts =
    alertsToShow.length > 0 ? alertsToShow : [defaultAlert];

  const baselineTempLabel =
    currentTempC !== null ? formatTemp(currentTempC) : '';

  const notificationModeLabel =
    notificationType === 'push'
      ? 'Push On (browser + in-dashboard)'
      : notificationType === 'email'
        ? 'Email On (email + in-dashboard)'
        : 'Push Off (in-dashboard only)';

  const notificationBadgeLabel =
    notificationType === 'push'
      ? 'Push: ON'
      : notificationType === 'email'
        ? 'Email: ON'
        : 'Push: OFF';

  const notificationBadgeClasses =
    notificationType === 'push'
      ? 'bg-emerald-500/10 border-emerald-400 text-emerald-300'
      : notificationType === 'email'
        ? 'bg-sky-500/10 border-sky-400 text-sky-300'
        : 'bg-slate-800 border-slate-600 text-slate-300';

  return (
    <div
      className={`h-full w-full px-4 py-6 sm:px-6 lg:px-10  overflow-y-auto ${theme === 'dark'
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
        : 'bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300'
        }`}
    >
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border shadow-lg text-sm ${toast.type === 'success'
            ? 'bg-emerald-600/90 border-emerald-400 text-white'
            : toast.type === 'warning'
              ? 'bg-amber-500/90 border-amber-300 text-slate-950'
              : 'bg-slate-800/95 border-slate-600 text-slate-50'
            }`}
        >
          {toast.message}
        </div>
      )}

      <div className="w-full space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl text-slate-400 mt-1">
              Smart Road Weather & Traffic Pred Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Live road cameras, road weather, and official FMI warnings for Finnish regions.
            </p>
          </div>
          {selectedRegion && (
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900/70 border border-slate-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-300">
                Focusing on region:&nbsp;
                <span className="font-semibold text-slate-100">{selectedRegion}</span>
              </span>
            </div>
          )}
        </div>

        {!locationEnabled ? (
          <div className="mt-6 max-w-3xl mx-auto border border-slate-700 rounded-2xl bg-slate-900/80 p-8 text-center">
            <h2 className="text-xl font-semibold text-slate-50 mb-3">
              Location is turned off
            </h2>
            <p className="text-sm text-slate-300 mb-4">
              To use the Smart Road Weather & Traffic dashboard with live camera context
              and region-based warnings, turn{' '}
              <span className="font-semibold">Location</span> ON in the{' '}
              <span className="font-semibold">Settings and Personalization</span> panel.
            </p>
            <p className="text-xs text-slate-500">
              Once enabled, this view will automatically update to show road-weather
              information and alerts based on your chosen camera area and FMI data.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-50 flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 rounded-full bg-sky-500/10 items-center justify-center">
                    <Wind className="h-4 w-4 text-sky-400" />
                  </span>
                  Live Traffic & Road Conditions
                  <InfoTooltip text="Search by location, pick a road type and set the expected road condition. The live camera list and warnings adapt to your choices so you can focus on one area at a time." />
                </h2>
                {baselineTempLabel && (
                  <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    Tampere baseline:{' '}
                    <span className="font-semibold">
                      {baselineTempLabel}
                    </span>
                  </span>
                )}
              </div>

              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search location (e.g. Tampere, Helsinki)..."
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                  />
                  <span className="absolute right-3 top-2.5 text-[11px] text-slate-500">
                    Press Enter to apply
                  </span>
                </div>
              </div>

              <div className="mb-4 border border-slate-800 rounded-2xl p-4 bg-slate-900/70">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1">
                    <h3 className="text-sm font-medium text-slate-100 flex items-center gap-1">
                      Live Camera
                      <InfoTooltip text="The live image only appears when a camera is available for your selected road type and filters. If no image is shown, try changing road type or clearing the search fields." />
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {roadType && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {roadType}
                      </span>
                    )}

                    {/* Notification mode badge */}
                    <span
                      className={
                        "text-[10px] px-2 py-0.5 rounded-full border " +
                        notificationBadgeClasses
                      }
                    >
                      {notificationBadgeLabel}
                    </span>

                    <button
                      type="button"
                      onClick={handleCameraReloadClick}
                      className="text-[11px] px-3 py-1 rounded-full bg-slate-800 border border-slate-600 
       text-slate-100 hover:bg-slate-700 hover:border-sky-500 
       flex items-center gap-1 transition"
                      disabled={!selectedCamera || cameraLoading}
                    >
                      {cameraLoading && (
                        <Loader className="w-3 h-3 animate-spin text-slate-200" />
                      )}
                      <span>Reload</span>
                    </button>
                  </div>

                </div>

                <div className="bg-black rounded-xl overflow-hidden relative border border-slate-800">
                  {cameraLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 z-10 backdrop-blur-sm">
                      <Loader className="w-7 h-7 animate-spin text-slate-100" />
                    </div>
                  )}
                  {currentCameraImage ? (
                    <img
                      src={currentCameraImage}
                      alt="Live camera feed"
                      className="w-full h-auto max-h-[260px] object-cover"
                      onError={(e) => {
                        console.error('Image load error');
                        e.currentTarget.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='250'%3E%3Crect width='400' height='250' fill='%23000'/%3E%3Ctext x='200' y='125' text-anchor='middle' fill='%23777' font-size='14'%3ECamera Unavailable%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  ) : (
                    <div className="w-full h-[220px] flex items-center justify-center text-slate-500 text-xs px-4 text-center">
                      {noCamerasMatchFilters
                        ? 'No cameras match the current road type and search filters. Try another road type or clear the filters.'
                        : 'Select a camera from the list to view the live feed.'}
                    </div>
                  )}
                </div>
                {lastImageUpdate && (
                  <p className="text-[11px] text-slate-400 text-center mt-2">
                    Last updated:{' '}
                    <span className="font-mono">
                      {lastImageUpdate.toLocaleDateString()}{' '}
                      {lastImageUpdate.toLocaleTimeString()}
                    </span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-700 rounded-2xl p-5 bg-slate-900/70">
                  <h4 className="font-semibold mb-4 text-center text-slate-100 text-xl">
                    Location details
                  </h4>

                  <p className="text-lg text-slate-300 text-center leading-relaxed">
                    {nearestWeatherStation ? (
                      <>
                        <span className="font-bold text-slate-50 text-xl">
                          {nearestWeatherStation.name}
                        </span>

                        {selectedRegion && (
                          <>
                            <br />
                            Region:{' '}
                            <span className="font-semibold text-slate-100 text-lg">
                              {selectedRegion}
                            </span>
                          </>
                        )}

                        {nearestWeatherStation.roadTemperature !== undefined && (
                          <>
                            <br />
                            Road:{' '}
                            <span className="font-semibold text-slate-100 text-lg">
                              {formatTemp(nearestWeatherStation.roadTemperature)}
                            </span>
                          </>
                        )}

                        {nearestWeatherStation.airTemperature !== undefined && (
                          <>
                            <br />
                            Air:{' '}
                            <span className="font-semibold text-slate-100 text-lg">
                              {formatTemp(nearestWeatherStation.airTemperature)}
                            </span>
                          </>
                        )}

                        {fmiPointData && (
                          <>
                            <br />
                            FMI forecast temp:{' '}
                            <span className="font-semibold text-slate-100 text-lg">
                              {fmiPointData.temperature !== undefined
                                ? formatTemp(fmiPointData.temperature)
                                : '-'}
                            </span>

                            {fmiPointData.windSpeed !== undefined && (
                              <>
                                <br />
                                FMI wind:{' '}
                                <span className="font-semibold text-slate-100 text-lg">
                                  {fmiPointData.windSpeed.toFixed(1)} m/s
                                </span>
                              </>
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        Location: {searchLocation || 'N/A'}
                        {baselineTempLabel && (
                          <>
                            <br />
                            Current baseline:{' '}
                            <span className="font-semibold text-slate-100 text-lg">
                              {baselineTempLabel}
                            </span>
                          </>
                        )}
                      </>
                    )}
                  </p>

                  {selectedCameraLocation && (
                    <p className="text-base text-slate-500 text-center mt-3">
                      Lat: {selectedCameraLocation.lat.toFixed(3)}, Lon:{' '}
                      {selectedCameraLocation.lon.toFixed(3)}
                    </p>
                  )}

                  {fmiPointData?.timestamp && (
                    <p className="text-base text-slate-500 text-center mt-2">
                      FMI time:{' '}
                      {new Date(fmiPointData.timestamp).toLocaleTimeString()}
                    </p>
                  )}

                  {nearestWeatherStation && (
                    <>
                      <div className="mt-4 text-center">
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-slate-600 bg-slate-800 mr-2 text-slate-200 text-base">
                          Selected:&nbsp;
                          <span className="font-semibold text-lg">
                            {conditions}
                          </span>
                        </span>

                        {detectedCondition && (
                          <span
                            className={
                              'inline-flex items-center justify-center px-3 py-1 rounded-full border text-base ' +
                              (detectedCondition === conditions
                                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
                                : 'border-amber-400 text-amber-300 bg-amber-500/10')
                            }
                          >
                            Detected:&nbsp;
                            <span className="font-semibold text-lg">
                              {detectedCondition}
                            </span>
                          </span>
                        )}
                      </div>

                      <div className="mt-4 text-center text-base text-slate-400 leading-relaxed space-y-2">
                        <div>
                          Road type:&nbsp;
                          <span className="font-semibold text-slate-100 text-lg">
                            {roadType}
                          </span>
                        </div>

                        <div>
                          Alert filter:&nbsp;
                          <span className="font-semibold text-slate-100 text-lg">
                            {selectedAlertType === 'all'
                              ? 'All types'
                              : selectedAlertType}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="border border-slate-700 rounded-2xl p-6 bg-slate-900/80">
                    <label className="block text-lg font-semibold text-slate-200 mb-3 flex items-center gap-1">
                      Live camera
                      <InfoTooltip text="Filter the camera list using the location search at the top and choose how the list is ordered here." />
                    </label>

                    <div className="flex items-center justify-between gap-3 mb-4">
                      <span className="text-xs text-slate-400">
                        Cameras available for {roadType.toLowerCase()}:
                        &nbsp;
                        <span className="font-semibold text-slate-100">
                          {filteredCameraPresets.length}
                        </span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Order by:</span>
                        <select
                          value={cameraSort}
                          onChange={(e) =>
                            setCameraSort(e.target.value as 'name' | 'id')
                          }
                          className="px-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                        >
                          <option value="name">Station name</option>
                          <option value="id">Preset ID</option>
                        </select>
                      </div>
                    </div>

                    <select
                      value={selectedCamera}
                      onChange={(e) => setSelectedCamera(e.target.value)}
                      className="w-full px-5 py-3 rounded-xl bg-slate-950 border border-slate-700 
                 text-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      disabled={cameraPresets.length === 0}
                    >
                      {cameraPresets.length === 0 ? (
                        <option className="text-xl">Loading cameras...</option>
                      ) : filteredCameraPresets.length === 0 ? (
                        <option className="text-xl">No cameras match filters</option>
                      ) : (
                        filteredCameraPresets.map((preset) => (
                          <option key={preset.id} value={preset.id} className="text-xl">
                            {preset.presentationName}
                          </option>
                        ))
                      )}
                    </select>

                    {noCamerasMatchFilters && (
                      <p className="mt-2 text-xs text-amber-300">
                        No cameras found for {roadType.toLowerCase()} with the current
                        search terms. Try a different road type or clear filters.
                      </p>
                    )}

                    <p className="mt-3 text-base text-slate-400">
                      Showing cameras on:{' '}
                      <span className="font-semibold text-slate-100 text-lg">
                        {roadType}
                      </span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="border border-slate-700 rounded-2xl p-5 bg-slate-900/80">
                      <label className="block text-lg font-semibold text-slate-200 mb-3 flex items-center justify-between mt-2">
                        <span className="flex flex-col leading-tight">
                          Road
                          <span>type</span>
                        </span>

                        <InfoTooltip text="Choose whether to show cameras on highways, local roads or city streets. Only existing cameras for that category are listed, which may temporarily hide the live image until you select a matching camera." />
                      </label>


                      <select
                        value={roadType}
                        onChange={(e) =>
                          setRoadType(e.target.value as typeof roadType)
                        }
                        className="w-full px-5 py-3 rounded-xl bg-slate-950 border border-slate-700 
                   text-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      >
                        <option value="Highways" className="text-xl">
                          Highways
                        </option>
                        <option value="Local Roads" className="text-xl">
                          Local Roads
                        </option>
                        <option value="City Streets" className="text-xl">
                          City Streets
                        </option>
                      </select>
                    </div>

                    <div className="border border-slate-700 rounded-2xl p-5 bg-slate-900/80">
                      <label className="block text-lg font-semibold text-slate-200 mb-3 flex items-center gap-1">
                        Road Conditions
                        <InfoTooltip text="Use this to focus on icy, wet or snowy warnings. The 'Detected' condition is derived from Digitraffic sensors and FMI model data near the selected camera." />
                      </label>

                      <select
                        value={conditions}
                        onChange={(e) =>
                          setConditions(e.target.value as typeof conditions)
                        }
                        className="w-full px-5 py-3 rounded-xl bg-slate-950 border border-slate-700 
                   text-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      >
                        <option value="Icy" className="text-xl">
                          Icy
                        </option>
                        <option value="Clear" className="text-xl">
                          Clear
                        </option>
                        <option value="Wet" className="text-xl">
                          Wet
                        </option>
                        <option value="Snowy" className="text-xl">
                          Snowy
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-50 flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 rounded-full bg-emerald-500/10 items-center justify-center">
                    <Sun className="h-4 w-4 text-emerald-300" />
                  </span>
                  Weather Forecast & Alerts
                </h2>
              </div>

              <div className="border border-slate-800 rounded-2xl p-4 mb-4 bg-slate-950/60">
                {loading ? (
                  <div className="flex items-center justify-center py-7 text-slate-300">
                    <Loader className="w-6 h-6 animate-spin mr-2" />
                    Loading weather data...
                  </div>
                ) : error ? (
                  <div className="text-center text-rose-400 text-sm py-4">{error}</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {weatherData.map((item, index) => {
                      const isNow = index === 0;
                      const tempDisplay =
                        item.tempValue !== undefined
                          ? Math.round(convertTempNumber(item.tempValue))
                          : parseInt(item.temp, 10);
                      return (
                        <div
                          key={index}
                          className={`relative border rounded-xl p-3 flex flex-col items-center ${isNow
                            ? 'border-emerald-400 bg-emerald-500/10 shadow-lg'
                            : 'border-slate-800 bg-slate-900/80'
                            }`}
                        >
                          {isNow && (
                            <span className="absolute top-1 right-2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-semibold">
                              NOW
                            </span>
                          )}
                          {renderWeatherIcon(item.icon)}
                          <div className="text-base font-semibold mt-2 text-slate-50">
                            {tempDisplay}
                            {unitSymbol}
                          </div>
                          <div className="text-xs text-slate-400">
                            {item.time}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border border-slate-800 rounded-2xl p-5 mb-4 bg-slate-950/60">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-1">
                    FMI Road Weather (Point Forecast)
                    <InfoTooltip text="FMI MEPS surface forecast for the area around the selected camera. This is model-based and complements the Digitraffic road station measurements." />
                  </h3>
                  <span className="text-sm text-slate-500 uppercase tracking-wide">
                    FMI MEPS Surface
                  </span>
                </div>

                <p className="text-base text-slate-400 mb-4">
                  Live model-based forecast for the selected camera’s area.
                </p>

                {selectedCamera && nearestWeatherStation && fmiPointData ? (
                  <div className="grid grid-cols-3 gap-3 text-base">
                    <div className="border border-slate-800 rounded-xl p-3 text-center bg-slate-900/80">
                      <div className="text-sm text-slate-400 mb-1">Region</div>
                      <div className="font-semibold text-slate-50 text-lg">
                        {selectedRegion || 'N/A'}
                      </div>
                    </div>

                    <div className="border border-slate-800 rounded-xl p-3 text-center bg-slate-900/80">
                      <div className="text-sm text-slate-400 mb-1">Temperature</div>
                      <div className="font-semibold text-slate-50 text-lg">
                        {fmiPointData.temperature !== undefined
                          ? formatTemp(fmiPointData.temperature)
                          : '-'}
                      </div>
                    </div>

                    <div className="border border-slate-800 rounded-xl p-3 text-center bg-slate-900/80">
                      <div className="text-sm text-slate-400 mb-1">Wind speed</div>
                      <div className="font-semibold text-slate-50 text-lg">
                        {fmiPointData.windSpeed !== undefined
                          ? `${fmiPointData.windSpeed.toFixed(1)} m/s`
                          : '-'}
                      </div>
                    </div>

                    <div className="border border-slate-800 rounded-xl p-3 text-center bg-slate-900/80 col-span-2">
                      <div className="text-sm text-slate-400 mb-1">Weather symbol code</div>
                      <div className="font-semibold text-slate-50 text-lg">
                        {fmiPointData.phenomenonCode || '-'}
                      </div>
                    </div>

                    <div className="border border-slate-800 rounded-xl p-3 text-center bg-slate-900/80">
                      <div className="text-sm text-slate-400 mb-1">Valid time</div>
                      <div className="font-mono text-sm text-slate-100">
                        {fmiPointData.timestamp
                          ? new Date(fmiPointData.timestamp).toLocaleTimeString()
                          : '-'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-base text-slate-400">
                    Select a live camera to view FMI point forecast for that area.
                  </div>
                )}
              </div>

              <div className="border border-slate-800 rounded-2xl p-5 bg-slate-950/60">
                <div className="flex items-center justify-between mb-3 gap-4">
                  <div className="flex flex-col">
                    <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-1">
                      Alerts{' '}
                      {selectedRegion && (
                        <span className="text-sm text-slate-400 ml-1">
                          ({selectedRegion})
                        </span>
                      )}
                      <InfoTooltip text="Official FMI CAP warnings are fetched and then filtered to your region and chosen road condition. If no warnings match the condition, a default information message is shown instead." />
                    </h3>

                    {nearestWeatherStation && (
                      <span className="text-sm text-slate-500">
                        Based on nearest Digitraffic station:&nbsp;
                        <span className="text-slate-200">
                          {nearestWeatherStation.name}
                        </span>
                      </span>
                    )}

                    <span className="text-xs text-slate-500 mt-1">
                      Filtering by:&nbsp;
                      <span className="font-semibold text-slate-100">
                        {conditions}
                      </span>{' '}
                      conditions
                    </span>
                    <span className="text-xs text-slate-500">
                      Notification mode:&nbsp;
                      <span className="font-semibold text-slate-100">
                        {notificationModeLabel}
                      </span>
                    </span>

                  </div>

                  <div className="flex flex-col items-end">
                    <label className="text-xs text-slate-500 mb-1">
                      Filter by warning type
                    </label>
                    <select
                      value={selectedAlertType}
                      onChange={(e) => setSelectedAlertType(e.target.value)}
                      className="px-3 py-1.5 text-sm rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                    >
                      <option value="all">All types</option>
                      {alertTypeOptions.map(([value, label]) => (
                        (typeof value === "string" && typeof label === "string") && <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {!selectedCamera && alerts.length === 0 && (
                      <div className="text-sm text-slate-400 mb-1">
                        Select a live camera to view official FMI warnings for that area.
                      </div>
                    )}

                    {selectedCamera &&
                      alerts.length > 0 &&
                      alertsFilteredByTypeAndCondition.length === 0 && (
                        <div className="text-xs text-slate-400 mb-1">
                          No warnings matching{' '}
                          <span className="font-semibold text-slate-100">
                            {conditions}
                          </span>{' '}
                          – showing all warnings of the selected type instead.
                        </div>
                      )}

                    {displayAlerts.map((alert, index) => (
                      <div
                        key={index}
                        className="flex flex-col gap-1 border border-slate-800 rounded-xl p-3 bg-slate-900/80"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${alert.color === 'red'
                              ? 'bg-rose-500'
                              : alert.color === 'green'
                                ? 'bg-emerald-400'
                                : 'bg-amber-400'
                              }`}
                          ></div>
                          <span className="text-xs uppercase tracking-wide text-slate-200">
                            {alert.eventName || 'Weather warning'}
                          </span>
                          <span className="ml-auto text-xs text-slate-500">
                            {alert.severity}
                          </span>
                        </div>

                        <div className="flex items-start gap-2">
                          <span className="text-sm flex-1 text-slate-300">
                            {alert.text}
                          </span>
                          <button className="w-7 h-7 border border-slate-600 rounded-full flex items-center justify-center hover:bg-slate-800 transition">
                            <Info className="w-3.5 h-3.5 text-slate-300" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-center border border-slate-800 rounded-2xl p-3 bg-slate-900/80">
                    {selectedCameraLocation ? (
                      <MapContainer
                        center={[
                          selectedCameraLocation.lat,
                          selectedCameraLocation.lon,
                        ]}
                        zoom={8}
                        scrollWheelZoom={false}
                        className="w-full h-80 rounded-xl overflow-hidden"
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution="&copy; OpenStreetMap contributors"
                        />
                        <Circle
                          center={[
                            selectedCameraLocation.lat,
                            selectedCameraLocation.lon,
                          ]}
                          radius={20000}
                          pathOptions={{ color: 'skyblue', fillOpacity: 0.2 }}
                        />
                      </MapContainer>
                    ) : (
                      <p className="text-sm text-slate-400 text-center px-4">
                        Select a live camera to view the location on the map.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrafficWeatherDashboard;
