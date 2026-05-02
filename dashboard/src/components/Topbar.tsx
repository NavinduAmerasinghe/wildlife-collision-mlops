//Topbar.tsx
import React, { useState, useEffect } from "react";
import SettingsIcon from "@mui/icons-material/Settings";
import CloseIcon from "@mui/icons-material/Close";
import { useSettings } from "../views/SettingsContext";
import { useHomeState } from '../redux/storeHooks';

const RadioButton = ({
  checked,
  onChange,
  label,
  theme,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  theme: "light" | "dark";
}) => (
  <label className="flex items-center gap-2 cursor-pointer group">
    <div className="relative">
      <input type="radio" checked={checked} onChange={onChange} className="sr-only" />
      <div
        className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
          checked
            ? "border-blue-500 bg-blue-50"
            : `border-gray-300 ${
                theme === "dark"
                  ? "bg-gray-700"
                  : "bg-white group-hover:border-blue-300"
              }`
        }`}
      >
        {checked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          </div>
        )}
      </div>
    </div>
    <span
      className={`text-xs transition-colors ${
        checked
          ? `${
              theme === "dark"
                ? "text-gray-100"
                : "text-gray-900"
            } font-medium`
          : `${theme === "dark" ? "text-gray-400" : "text-gray-600"}`
      }`}
    >
      {label}
    </span>
  </label>
);

const Topbar: React.FC = () => {
  const {
    theme,
    setTheme,
    temperatureUnit,
    setTemperatureUnit,
    notificationType,
    setNotificationType,
    locationEnabled,
    setLocationEnabled,
  } = useSettings();

  const [open, setOpen] = useState(false);
  const [location, setLocation] = useHomeState('location')

  useEffect(() => {
      if (!locationEnabled) {
        setLocation({ lat: 60.192059, lng: 24.945831 })
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          setLocation({ lat: 60.192059, lng: 24.945831 })
        }
      );
    }, [locationEnabled]);

  
  return (
    <>
      <header className="h-[64px] bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-6">
        <div>
          <h3 className="text-xl font-semibold text-slate-800 tracking-wide">
            Dashboard
          </h3>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="p-2 rounded-full hover:bg-slate-100 cursor-pointer transition flex items-center justify-center"
          >
            <SettingsIcon className="text-slate-600" />
          </button>
        </div>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className={`w-full max-w-xl mx-4 rounded-2xl shadow-2xl border ${
              theme === "dark"
                ? "bg-gray-900 border-gray-700"
                : "bg-white border-slate-200"
            } p-5 sm:p-6 md:p-7 relative max-h-[90vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2
                  className={`text-lg sm:text-xl font-semibold ${
                    theme === "dark" ? "text-gray-100" : "text-slate-900"
                  }`}
                >
                  Settings & Personalization
                </h2>
                <p
                  className={`text-[11px] mt-1 ${
                    theme === "dark" ? "text-gray-400" : "text-slate-500"
                  }`}
                >
                  These preferences control the dashboard, analytics, and prediction
                  behaviour in real time.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={`p-1.5 rounded-full transition-colors ${
                  theme === "dark" ? "hover:bg-gray-800" : "hover:bg-slate-100"
                }`}
              >
                <CloseIcon
                  className={`w-5 h-5 ${
                    theme === "dark" ? "text-gray-400" : "text-slate-500"
                  }`}
                />
              </button>
            </div>

            <div className="space-y-4 sm:space-y-5">
              {/* Temperature Unit */}
              <div
                className={`rounded-xl p-4 border transition-all duration-300 ${
                  theme === "dark"
                    ? "bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border-blue-800"
                    : "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100"
                }`}
              >
                <h3
                  className={`text-[12px] sm:text-sm font-semibold mb-1.5 ${
                    theme === "dark" ? "text-gray-200" : "text-gray-800"
                  }`}
                >
                  User Preferences
                </h3>
                <p
                  className={`text-[11px] mb-3 ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Choose how temperatures are displayed in the dashboard and
                  Analytics & Trends.
                </p>
                <div className="flex items-center justify-between gap-4">
                  <RadioButton
                    checked={temperatureUnit === "celsius"}
                    onChange={() => setTemperatureUnit("celsius")}
                    label="Celsius (°C)"
                    theme={theme}
                  />
                  <RadioButton
                    checked={temperatureUnit === "fahrenheit"}
                    onChange={() => setTemperatureUnit("fahrenheit")}
                    label="Fahrenheit (°F)"
                    theme={theme}
                  />
                </div>
                <div
                  className={`mt-3 p-2 rounded-lg text-[10px] text-center ${
                    theme === "dark"
                      ? "bg-blue-900/30 text-blue-300"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  Analytics charts and forecast cards will update to{" "}
                  {temperatureUnit === "celsius" ? "°C" : "°F"} immediately.
                </div>
              </div>

              {/* Notifications – PUSH / EMAIL / OFF */}
              <div
                className={`rounded-xl p-4 border transition-all duration-300 ${
                  theme === "dark"
                    ? "bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-800"
                    : "bg-gradient-to-br from-green-50 to-emerald-50 border-green-100"
                }`}
              >
                <h3
                  className={`text-[12px] sm:text-sm font-semibold mb-1.5 ${
                    theme === "dark" ? "text-gray-200" : "text-gray-800"
                  }`}
                >
                  Notifications
                </h3>
                <p
                  className={`text-[11px] mb-3 ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Control whether browser push notifications and/or email alerts are used
                  for camera refresh events and detected road condition changes.
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <RadioButton
                    checked={notificationType === "push"}
                    onChange={() => setNotificationType("push")}
                    label="Push On"
                    theme={theme}
                  />
                  <RadioButton
                    checked={notificationType === "email"}
                    onChange={() => setNotificationType("email")}
                    label="Email"
                    theme={theme}
                  />
                  <RadioButton
                    checked={notificationType === "off"}
                    onChange={() => setNotificationType("off")}
                    label="Push Off"
                    theme={theme}
                  />
                </div>
                <p className="text-[10px] mt-2 text-slate-500">
                  When Push is OFF, only in-dashboard messages (banners/toasts) will be
                  shown — no browser-level alerts or emails.
                </p>
              </div>

              {/* Theme */}
              <div
                className={`rounded-xl p-4 border transition-all duration-300 ${
                  theme === "dark"
                    ? "bg-gradient-to-br from-amber-900/20 to-orange-900/20 border-amber-800"
                    : "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100"
                }`}
              >
                <h3
                  className={`text-[12px] sm:text-sm font-semibold mb-1.5 ${
                    theme === "dark" ? "text-gray-200" : "text-gray-800"
                  }`}
                >
                  Theme
                </h3>
                <p
                  className={`text-[11px] mb-3 ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Switch between light and dark appearance for all views.
                </p>
                <div className="flex items-center justify-between gap-4">
                  <RadioButton
                    checked={theme === "light"}
                    onChange={() => setTheme("light")}
                    label="Light"
                    theme={theme}
                  />
                  <RadioButton
                    checked={theme === "dark"}
                    onChange={() => setTheme("dark")}
                    label="Dark"
                    theme={theme}
                  />
                </div>
              </div>

              {/* Location */}
              <div
                className={`rounded-xl p-4 border transition-all duration-300 ${
                  theme === "dark"
                    ? "bg-gradient-to-br from-rose-900/20 to-pink-900/20 border-rose-800"
                    : "bg-gradient-to-br from-rose-50 to-pink-50 border-rose-100"
                }`}
              >
                <h3
                  className={`text-[12px] sm:text-sm font-semibold mb-1.5 ${
                    theme === "dark" ? "text-gray-200" : "text-gray-800"
                  }`}
                >
                  Location
                </h3>
                <p
                  className={`text-[11px] mb-3 ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Controls whether the dashboard, Analytics & Trends, and route predictions
                  use your location / camera context for region-aware data.
                </p>
                <div className="flex items-center justify-between gap-4">
                  <RadioButton
                    checked={locationEnabled}
                    onChange={() => setLocationEnabled(true)}
                    label="On"
                    theme={theme}
                  />
                  <RadioButton
                    checked={!locationEnabled}
                    onChange={() => setLocationEnabled(false)}
                    label="Off"
                    theme={theme}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                  If turned OFF, some live features (e.g. camera-based predictions and
                  region alerts) may be hidden or limited.
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Topbar;
