import { Navigate, Routes, Route } from "react-router-dom";
import ViewContainer from "./containers/ViewContainer";
import AnalyticsAndTrends from './views/AnalyticsandTrends'
import TrafficWeatherDashboard from './views/TrafficWeatherDashboard';
import RoutePrediction from './views/RoutePred';
import EnvMonitor from './views/EnvMonitoring';
import Alerts from './views/Alerts';
import Cameras from './views/Cameras';
import LandingPage from './views/LandingPage';
import { SettingsProvider, useSettings } from "./views/SettingsContext";

function AppRoutes() {
  const { userRole } = useSettings();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/" element={<ViewContainer />}>
        {userRole === 'admin' ? (
          <>
            <Route path="/analytics" element={<AnalyticsAndTrends />} />
            <Route path="/liveTraffic" element={<TrafficWeatherDashboard />} />
            <Route path="/routePrediction" element={<RoutePrediction />} />
            <Route path="/envMonitor" element={<EnvMonitor />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/cameras" element={<Cameras />} />
          </>
        ) : (
          <>
            <Route path="/routePrediction" element={<RoutePrediction />} />
            <Route path="/envMonitor" element={<EnvMonitor />} />
            <Route path="*" element={<Navigate to="/routePrediction" replace />} />
          </>
        )}
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <SettingsProvider>
      <AppRoutes />
    </SettingsProvider>
  )
}
export default App