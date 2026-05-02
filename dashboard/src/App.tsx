import { Routes, Route } from "react-router-dom";
import ViewContainer from "./containers/ViewContainer";
import HomeView from "./views/HomeView"
import AnalyticsAndTrends from './views/AnalyticsandTrends'
import TrafficWeatherDashboard from './views/TrafficWeatherDashboard';
import { SettingsProvider } from "./views/SettingsContext";
import LocationView from "./views/LocationView";

function App() {
  return (
    <SettingsProvider> 
      <Routes>
        <Route path="/" element={<ViewContainer/>}>
          <Route index element={<HomeView />} />
          <Route path="/location" element={<LocationView/>}/>
          <Route path="/analytics" element={<AnalyticsAndTrends/>}/>
          <Route path="/liveTraffic" element={<TrafficWeatherDashboard/>}/>
        </Route>
      </Routes>
    </SettingsProvider>
  )
}
export default App