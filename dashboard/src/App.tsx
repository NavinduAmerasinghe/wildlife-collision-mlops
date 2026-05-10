import { Routes, Route } from "react-router-dom";
import ViewContainer from "./containers/ViewContainer";
import AnalyticsAndTrends from './views/AnalyticsandTrends'
import TrafficWeatherDashboard from './views/TrafficWeatherDashboard';
import Alerts from './views/Alerts';
import Cameras from './views/Cameras';
import LandingPage from './views/LandingPage';
import { SettingsProvider } from "./views/SettingsContext";

function App() {
  return (
    <SettingsProvider> 
      <Routes>
        <Route path="/" element={<LandingPage/>}/>
        <Route path="/" element={<ViewContainer/>}>
          <Route path="/analytics" element={<AnalyticsAndTrends/>}/>
          <Route path="/liveTraffic" element={<TrafficWeatherDashboard/>}/>
          <Route path="/alerts" element={<Alerts/>}/>
          <Route path="/cameras" element={<Cameras/>}/>
        </Route>
      </Routes>
    </SettingsProvider>
  )
}
export default App