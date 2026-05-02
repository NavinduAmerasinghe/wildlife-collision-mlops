import { useEffect } from 'react';
import SunnyIcon from '@mui/icons-material/Sunny';
import AirIcon from '@mui/icons-material/Air';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import useAxios from '../hooks/useAxios';
import CircularProgress from '@mui/material/CircularProgress';
import { useSettings } from './SettingsContext';
import { MapData, WeatherData, SummaryData, TimeData } from '../types/Home'
import { useHomeState } from '../redux/storeHooks';
import Slider from "@mui/material/Slider";
import L from "leaflet";
import ReactDOMServer from "react-dom/server";
import LocationPinIcon from '@mui/icons-material/LocationPin';

const muiMarker = L.divIcon({
  html: ReactDOMServer.renderToString(
    <LocationPinIcon
      style={{
        color: "#d32f2f",
        fontSize: "40px",
      }}
    />
  ),
  className: "",
  iconSize: [40, 40],
  iconAnchor: [20, 40], 
});

const marks = [...Array(25).keys()].map((i) => ({
  value: i,
  label: i % 2 === 0 ? i.toString() : ""
}));

const regions = {
  Helsinki: [60.1695, 24.9355],
  Tampere: [61.4991, 23.7871],
  Oulu: [65.0124, 25.4682],
  Rovaniemi: [66.5022, 25.7325],
  Turku: [60.4515, 22.2687],
}

const getClosestRegion = (lat: number, lon: number) => {
  let closest: string | null = null;
  let minDist = Infinity;

  for (const [name, [rLat, rLon]] of Object.entries(regions)) {
    const dist = Math.pow(lat - rLat, 2) + Math.pow(lon - rLon, 2);
    if (dist < minDist) {
      minDist = dist;
      closest = name;
    }
  }
  if(closest == null){
    return "Helsinki"
  } else {
    return closest;
  }
}

const themeClass = {
  dark: {
    background: 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900',
    h1: 'text-gray-100',
    h2: 'text-gray-100',
    text: 'text-gray-400',
    container: 'border border-slate-700 rounded-2xl bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800',
    container2: 'border border-slate-700 bg-gray-900',
    icon: "#9CA3AF"
  },
  light: {
    background: 'bg-gradient-to-br from-gray-300 via-gray-200 to-gray-300',
    h1: 'text-gray-900',
    h2: 'text-gray-800',
    text: 'text-gray-700',
    container: 'border border-slate-300 rounded-2xl bg-gray-200 backdrop-blur-sm',
    container2: 'border border-slate-300 bg-gray-200',
    icon: "#374151"
  }
}

const toUTCDate = (time: number) => {
  const now = new Date();
  return new Date(Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    time,
    0o0
  ));
};

const getClosestTimeValue = (type: string, hour: number, values: TimeData[]) => {
  const filtered = values.filter(v => v.dataType === type);

  if (filtered.length === 0) return null;

  let closest: TimeData | null = null;
  let minDiff = Infinity;

  for (const item of filtered) {
    const itemHour = new Date(item.timestamp).getHours(); 
    const diff = Math.abs(itemHour - hour);

    if (diff < minDiff) {
      minDiff = diff;
      closest = item;
    }
  }
  if(closest){
    return closest.value;
  } else {
    return 0
  }
};

const HomeView: React.FC = () => {

  const { theme, temperatureUnit, locationEnabled } = useSettings();

  const [hour, setHour] = useHomeState('hour')
  const [location, setLocation] = useHomeState('location')

  const [mapData, setMapData] = useHomeState('mapData')
  const [mapError, setMapError] = useHomeState('mapError')
  const [weatherData, setWeatherData] = useHomeState('weatherData')
  const [weatherError, setWeatherError] = useHomeState('weatherError')
  const [summaryData, setSummaryData] = useHomeState('summaryData')
  const [summaryError, setSummaryError] = useHomeState('summaryError')
  const [timeData, setTimeData] = useHomeState('timeData')
  const [timeError, setTimeError] = useHomeState('timeError')



  const {
    data: wData,
    loading: weatherLoading,
    error: wError
  } = useAxios<WeatherData[]>({
    url: "dashboard/weather"
  })

  const {
    data: sData,
    loading: summaryLoading,
    error: sError
  } = useAxios<SummaryData>({
    url: "dashboard/summary"
  })

  const {
    data: mData,
    loading: mapLoading,
    error: mError
  } = useAxios<MapData[]>({
    url: "dashboard/map",
  })

  const {
    data: tData,
    loading: timeLoading,
    error: tError
  } = useAxios<TimeData[]>({
    url: `dashboard/timeline?region=${getClosestRegion(location[0], location[1]) + "%20Region"}&from=${toUTCDate(0).toISOString()}&to=${toUTCDate(24).toISOString()}`
  })

  useEffect(() => {
    if (mData) setMapData(mData);
  }, [mData]);

  useEffect(() => {
    if (mError) setMapError(mError);
  }, [mError]);

  useEffect(() => {
    if (wData) setWeatherData(wData);
  }, [wData]);

  useEffect(() => {
    if (wError) setWeatherError(wError);
  }, [wError]);

  useEffect(() => {
    if (sData) setSummaryData(sData);
  }, [sData]);

  useEffect(() => {
    if (sError) setSummaryError(sError);
  }, [sError]);

  useEffect(() => {
    if (tData) setTimeData(tData);
  }, [tData]);

  useEffect(() => {
    if (tError) setTimeError(tError);
  }, [tError]);

  const errorText = (error) => {
    return <div className={themeClass[theme].text}>{error}</div>
  }

  const formatTemp = (tempC?: number | null): string => {
    if (tempC === undefined || tempC === null || isNaN(tempC)) return '-';
    if (temperatureUnit === 'celsius') return `${Math.round(tempC)}°C`;
    return `${Math.round((tempC * 9) / 5 + 32)}°F`;
  };

  const getPointData = (data: MapData, regions: WeatherData[]) => {
    const closest = getClosestRegion(data.latitude, data.longitude)
    const regionData = regions != null ? regions.find(d => d.region.toLocaleLowerCase().includes(closest.toLocaleLowerCase())) : null
    if (regionData) {
      return <>
        <div className="font-medium">{data.name}</div>
        <div>RoadCondition: {data.roadCondition}</div>
        <div>Temperature: {formatTemp(regionData.temperature)}</div>
        <div>WindSpeed: {regionData.windSpeed + " m/s"}</div>
        <div>Precipitation: {regionData.precipitation + " mm"}</div>
      </>
    } else {
      return <>
        <div className="font-medium">{data.name}</div>
        <div>RoadCondition: {data.roadCondition}</div>
      </>
    }
  }

  return (
    <div className={`flex w-[100%] h-[100%] justify-center items-center min-h-screen w-full px-4 sm:px-6 lg:px-10 py-4 transition-colors duration-500 text-[15px] sm:text-base ${themeClass[theme].background}`}>
      <div className={`rounded-2xl shadow-lg p-[40px] hover:shadow-xl transition-all duration-300 flex flex-col justify-between item-center w-[70%] h-[90%] ${themeClass[theme].container}`}>
        <div className='flex justify-between'>
          <h2 className={`text-2xl font-bold mb-8 ${themeClass[theme].h1}`}>Home Dashboard Overview</h2>
          <div>
            <p className={`text-m ${themeClass[theme].text}`}>Activate location from settings to get data closest to your location.</p>
          </div>
        </div>
        <div className="flex w-full justify-between w-full h-[80%]">
          <div className="flex flex-col w-[75%] h-full justify-between">
            <div className="flex w-full justify-between h-[28%]">
              <div className={`rounded-2xl shadow-lg p-5 sm:p-6 hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-around w-[32%] ${themeClass[theme].container2} ${themeClass[theme].text}`}>
                {weatherLoading && <CircularProgress />}
                {weatherError && errorText(weatherError)}
                {!weatherLoading && !weatherError && weatherData && <>
                  <span className="text-[20px] font-medium">Temperature</span>
                  <SunnyIcon sx={{ fontSize: 35, color: themeClass[theme].icon }}></SunnyIcon>
                  <span className="text-sm">{formatTemp(getClosestTimeValue("temperature", hour, timeData))}</span>
                </>}
              </div>
              <div className={`rounded-2xl shadow-lg p-5 sm:p-6 hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-around w-[32%] ${themeClass[theme].container2} ${themeClass[theme].text}`}>
                {weatherLoading && <CircularProgress />}
                {weatherError && errorText(weatherError)}
                {!weatherLoading && !weatherError && weatherData && <>
                  <span className="text-[20px] font-medium">Wind</span>
                  <AirIcon sx={{ fontSize: 35, color: themeClass[theme].icon }}></AirIcon>
                  <span className="text-sm">{getClosestTimeValue("wind_speed", hour, timeData) + " m/s"}</span>
                </>}
              </div>
              <div className={`rounded-2xl shadow-lg p-5 sm:p-6 hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-around w-[32%] ${themeClass[theme].container2} ${themeClass[theme].text}`}>
                {weatherLoading && <CircularProgress />}
                {weatherError && errorText(weatherError)}
                {!weatherLoading && !weatherError && weatherData && <>
                  <span className="text-[20px] font-medium">Precipitation</span>
                  <WaterDropIcon sx={{ fontSize: 35, color: themeClass[theme].icon }}></WaterDropIcon>
                  <span className="text-sm">{getClosestTimeValue("precipitation", hour, timeData) + " mm"}</span>
                </>}
              </div>
            </div>
            <div className={`rounded-2xl shadow-lg p-5 sm:p-6 hover:shadow-xl transition-all duration-300 flex items-center justify-center rounded-lg p-3 w-full h-[70%] ${themeClass[theme].container2}`}>
              {mapLoading && <CircularProgress />}
              {mapError && errorText(mapError)}
              {!mapLoading && !mapError && <MapContainer
                center={location}
                zoom={10}
                className="h-full w-full"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {mapData && mapData.map((p) => (
                  <Marker key={p.id} position={[p.latitude, p.longitude]} icon={muiMarker}>
                    <Popup>
                      {getPointData(p, weatherData)}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
              }
            </div>
          </div>
          <div className={`rounded-2xl shadow-lg p-5 gap-5 sm:p-6 hover:shadow-xl transition-all duration-300 p-[20px] flex flex-col items-center w-[24%] ${themeClass[theme].container2}`}>
            <h3 className={`text-[20px] font-medium mb-1 ${themeClass[theme].h2}`}>Alerts</h3>
            <div className="flex flex-col gap-1 items-center justify-around text-sm ml-2 h-full">
              {summaryLoading && <CircularProgress />}
              {summaryError && errorText(summaryError)}
              {!summaryLoading && !summaryError && summaryData && <>
                <div className='flex flex-col w-[100%] h-[40%] gap-5'>
                  <h3 className={`flex items-center text-[15px] ${themeClass[theme].h2}`}>
                    Accidents
                  </h3>
                  <ul className={`flex flex-col gap-2 ${themeClass[theme].text}`}>
                    {summaryData.alerts.map(d => {
                      return <li>{d}</li>
                    })}
                  </ul>
                </div>
                <div className='flex flex-col w-[100%] h-[40%] gap-5'>
                  <h3 className={`flex items-center text-[15px] ${themeClass[theme].h2}`}>
                    Road Closures
                  </h3>
                  <ul className={`flex flex-col gap-2 ${themeClass[theme].text}`}>
                    <li>{`Temperature: ${formatTemp(summaryData.temperature)}`}</li>
                    <li>{`Road friction: ${summaryData.temperature}`}</li>
                    <li>{`Congestion level: ${summaryData.temperature}`}</li>
                  </ul>
                </div>
              </>}
            </div>
          </div>
        </div>
              <div>
        <Slider
          className={themeClass[theme].text}
          value={hour}
          onChange={(e, v) => setHour(v as number)}
          min={0}
          max={24}
          step={1}
          marks={marks}
          sx={{ 
            color: themeClass[theme].icon,
            '& .MuiSlider-markLabel': {
                  color: themeClass[theme].icon,
               }
          
          }}
        />
      </div>
      </div>
    </div>
  );
}

export default HomeView;