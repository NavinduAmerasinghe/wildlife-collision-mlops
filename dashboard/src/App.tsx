import { Routes, Route } from "react-router-dom";
import ViewContainer from "./containers/ViewContainer";
import AnalyticsAndTrends from './views/AnalyticsandTrends'
import TrafficWeatherDashboard from './views/TrafficWeatherDashboard';
import { SettingsProvider } from "./views/SettingsContext";

function App() {
  return (
    <SettingsProvider> 
      <Routes>
        <Route path="/" element={<ViewContainer/>}>
          <Route path="/analytics" element={<AnalyticsAndTrends/>}/>
          <Route path="/liveTraffic" element={<TrafficWeatherDashboard/>}/>
        </Route>
      </Routes>
    </SettingsProvider>
  )
}
export default App