import { useRef, useEffect } from 'react';
import Slider from "@mui/material/Slider";
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TrafficIcon from '@mui/icons-material/Traffic';
import CloudIcon from '@mui/icons-material/Cloud';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import useAxios from '../hooks/useAxios';
import CircularProgress from '@mui/material/CircularProgress';
import { useSettings } from './SettingsContext';
import {
  RouteTimelineData,
  RouteSummaryData,
  SearchData
} from '../types/Location'
import { useLocationState } from '../redux/storeHooks';

const marks = [...Array(25).keys()].map((i) => ({
  value: i,
  label: i % 2 === 0 ? i.toString() : ""
}));



const buildUrl = (city: string, road: string) => {
  let url = "insights/search?";
  if (city.length > 0) {
    url += `city=${city}&`;
  }
  if (road.length > 0) {
    url += `roadName=${road}`;
  }
  return url;
}

const themeClass = {
  dark: {
    background: 'bg-gray-900',
    h1: 'text-gray-100',
    h2: 'text-gray-200',
    h3: 'text-gray-300',
    text: 'text-gray-400',
    container: 'bg-gray-800',
    lines: 'text-gray-400 border-slate-500',
    icon: "#9CA3AF",
    condition: 'bg-gray-200 text-gray-600'
  },
  light: {
    background: 'bg-gradient-to-br from-gray-300 via-gray-200 to-gray-300',
    h1: 'text-gray-900',
    h2: 'text-gray-800',
    h3: 'text-gray-700',
    text: 'text-gray-600',
    container: 'border border-slate-300 rounded-2xl bg-gray-200 backdrop-blur-sm',
    lines: 'text-gray-600 border-slate-1000',
    icon: "#374151",
    condition: 'bg-gray-800 text-gray-400'
  }
}
const WINDOW = 5

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

const LocationView: React.FC = () => {

  const { theme, temperatureUnit } = useSettings();

  const [timeWindow, setTimeWindow] = useLocationState('timeWindow');
  const [openSummary, setOpenSummary] = useLocationState('openSummary');
  const [openAlerts, setOpenAlerts] = useLocationState('openAlerts');
  const [city, setCity] = useLocationState('city');
  const [road, setRoad] = useLocationState('road');
  const [searchData, setSearchData] = useLocationState('searchData');
  const [searchError, setSearchError] = useLocationState('searchError');
  const [roadData, setRoadData] = useLocationState('roadData');
  const [roadError, setRoadError] = useLocationState('roadError');
  const [timeData, setTimeData] = useLocationState('timeData');
  const [timeError, setTimeError] = useLocationState('timeError');

  const {
    data: sData,
    loading: searchLoading,
    error: sError,
    refetch: fetchData
  } = useAxios<SearchData>({
    url: buildUrl(city, road),
    immediate: false
  })

  const {
    data: rData,
    loading: roadLoading,
    error: rError,
    refetch: fetchRoad
  } = useAxios<RouteSummaryData>({
    url: "insights/route-summary",
    method: "post",
    body: {
      points: [
        {
          latitude: searchData?.latitude,
          longitude: searchData?.longitude
        }
      ]
    },
    immediate: false,
    dependencies: [searchData]
  })

  const {
    data: tData,
    loading: timeLoading,
    error: tError,
    refetch: fetchTime
  } = useAxios<RouteTimelineData[]>({
    url: "insights/route-timeline",
    method: "post",
    body: {
      points: [
        {
          latitude: searchData?.latitude,
          longitude: searchData?.longitude
        }
      ],
      from: toUTCDate(0).toISOString(),
      to: toUTCDate(24).toISOString()
    },
    immediate: false,
    dependencies: [searchData]
  })

  useEffect(() => {
    if (sData) {
      setSearchData(sData);
    }
  }, [sData]);

  const prev = useRef(searchData);

  useEffect(() => {
    if (prev.current !== searchData) {
      fetchRoad();
      fetchTime();
    }
    prev.current = searchData;
  }, [searchData]);

  useEffect(() => {
    if (sError) setSearchError(sError);
  }, [sError]);

  useEffect(() => {
    if (rData) {
      console.log("data: " + rData)
      let copy = rData
      copy.hazards = [... new Set(copy.hazards)]
      setRoadData(copy);
    }
  }, [rData]);

  useEffect(() => {
    if (rError) setRoadError(rError);
  }, [rError]);

  useEffect(() => {
    if (tData) setTimeData(tData);
  }, [tData]);

  useEffect(() => {
    if (tError) setTimeError(tError);
  }, [tError]);

  const moveWindow = (event: any, newValue: number | number[]) => {
    let [start, end] = newValue as number[];
    let [oldStart, oldEnd] = timeWindow as number[];

    if (oldStart != start) {
      let maxStart = start > 0 ? 19 : 0
      let newStart = start < 0 || start > 19 ? maxStart : start
      setTimeWindow([newStart, newStart + WINDOW])
    } else if (oldEnd != end) {
      let maxEnd = end < 24 ? 5 : 24
      let newEnd = end > 24 || end < 5 ? maxEnd : end
      setTimeWindow([newEnd - WINDOW, newEnd])
    }
  };

  const formatTemp = (tempC?: number | null): string => {
    if (tempC === undefined || tempC === null || isNaN(tempC)) return '-';
    if (temperatureUnit === 'celsius') return `${Math.round(tempC)}°C`;
    return `${Math.round((tempC * 9) / 5 + 32)}°F`;
  };

  const getSpan = () => {
    let [start, end] = timeWindow as number[];
    let hourData = []
    if (!timeData || timeData.length == 0) {
      return []
    }
    let currentHour = start
    for (let i = 0; i < 6; i++) {
      hourData.push({
        hour: `${currentHour.toString().padStart(2, "0")}:00`,
        condition: timeData[currentHour].condition,
        temp: formatTemp(timeData[currentHour].temp)
      })
      currentHour++
    }
    return hourData
  }

  const loading = searchLoading || roadLoading
  const error = searchError || roadError

  return (
    <div className={`flex w-[100%] h-[100%] justify-center items-center min-h-screen w-full px-4 sm:px-6 lg:px-10 py-4 transition-colors duration-500 text-[15px] sm:text-base ${themeClass[theme].background}`}>
      <div className={`rounded-2xl flex flex-col justify-between shadow-lg p-[40px] hover:shadow-xl transition-all duration-300 w-[70%] h-[90%] ${themeClass[theme].container}`}>
        <div className='flex justify-between'>
          <h2 className={`text-xl font-semibold ${themeClass[theme].h1}`}>Location-Based Insights</h2>
          <div>
            <p className={`text-m ${themeClass[theme].text}`}>Search city and/or road to view location related data.</p>
          </div>
        </div>
        <div>
          <h3 className={`text-[15px] font-semibold ${themeClass[theme].h2}`}>City</h3>
          <input
            type="text"
            placeholder="Search"
            className={`w-full border rounded-md px-3 py-2 text-sm ${themeClass[theme].lines}`}
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>
        <div>
          <h3 className={`text-[15px] font-semibold ${themeClass[theme].h2}`}>Road</h3>
          <input
            type="text"
            placeholder="Search"
            className={`w-full border rounded-md px-3 py-2 text-sm ${themeClass[theme].lines}`}
            value={road}
            onChange={(e) => setRoad(e.target.value)}
          />
        </div>
        <div>
          <button onClick={() => { fetchData() }} className={`border rounded-md px-3 py-2 text-sm cursor-pointer ${themeClass[theme].lines}`}>Search</button>
        </div>
        <div className={`border-t pt-3 ${themeClass[theme].lines}`}>
          <button
            className={`w-full flex justify-between items-center cursor-pointer ${themeClass[theme].lines}`}
            onClick={() => setOpenSummary(!openSummary)}>
            <h3 className={`text-lg font-medium ${themeClass[theme].h2}`}>Route Summary</h3>
            {openSummary ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </button>
          {loading && <CircularProgress />}
          {error && error}
          {!loading && !error && roadData && openSummary && (
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-2 ${themeClass[theme].h3}`}>
                  <DirectionsCarIcon />
                  <span>Road Conditions</span>
                </div>
                <div className={`px-3 py-1 rounded-md ${themeClass[theme].condition}`}>{roadData.conditions[0].condition}</div>
              </div>

              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-2 ${themeClass[theme].h3}`}>
                  <CloudIcon />
                  <span>Weather Forecast</span>
                </div>
                <div className={`px-3 py-1 rounded-md ${themeClass[theme].condition}`}>{roadData.weatherForecasts[0].weatherCondition}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-2 ${themeClass[theme].h3}`}>
                  <TrafficIcon />
                  <span>Traffic Flow</span>
                </div>
                <div className={`px-3 py-1 rounded-md ${themeClass[theme].condition}`}>{roadData.trafficFlows[0].congestionLevel}</div>
              </div>
            </div>)}

        </div>
        <div className={`border-t pt-3 ${themeClass[theme].lines}`}>
          <button
            className={`w-full flex justify-between items-center cursor-pointer ${themeClass[theme].lines}`}
            onClick={() => setOpenAlerts(!openAlerts)}>
            <h3 className={`text-lg font-medium ${themeClass[theme].h2}`}>Alerts</h3>
            {openAlerts ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </button>
          {loading && <CircularProgress />}
          {error && error}
          {!loading && !error && roadData && openAlerts && (
            <div className="mt-3 space-y-2 text-sm">
              {roadData.hazards.map(d => {
                return <div className="flex items-center gap-2"><span>⚠️</span> <span>{d}</span></div>
              })}
            </div>)}
        </div>
        <div className={`border-t pt-3 ${themeClass[theme].lines}`}>
          <h3 className={`text-lg font-medium ${themeClass[theme].h2}`}>Route Timeline</h3>

          <div className={`border rounded-md mt-3 p-2 overflow-x-auto ${themeClass[theme].lines}`}>
            {timeLoading && <CircularProgress />}
            {timeError && timeError}
            {!timeLoading && !timeError &&
              <div className={`grid grid-cols-6 text-center gap-2 ${themeClass[theme].text}`}>
                {getSpan().map((d, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <span className="text-sm font-medium">{d.hour}</span>

                    <span className={`px-3 py-0 rounded-md ${themeClass[theme].condition}`}>{d.condition}</span>

                    <span className="text-sm mt-1">{d.temp}</span>
                  </div>
                ))}

              </div>}
          </div>
        </div>
        <div>
          <Slider
            value={timeWindow}
            onChange={moveWindow}
            min={0}
            max={24}
            step={1}
            track={false}
            marks={marks}
            sx={{
              color: themeClass[theme].icon,
              '& .MuiSlider-markLabel': {
                color: themeClass[theme].icon,
              },
              "& .MuiSlider-thumb": {
                width: 3,
                height: 32,
                borderRadius: 0,
                backgroundColor: themeClass[theme].icon,
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default LocationView;