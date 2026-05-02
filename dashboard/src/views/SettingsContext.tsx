// SettingsContext.tsx
import React, { createContext, useContext, useState } from 'react';

export type TemperatureUnit = 'celsius' | 'fahrenheit';
export type ThemeMode = 'light' | 'dark';
export type NotificationType = 'push' | 'email' | 'off';

interface SettingsContextValue {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;

  temperatureUnit: TemperatureUnit;
  setTemperatureUnit: (t: TemperatureUnit) => void;

  notificationType: NotificationType;
  setNotificationType: (t: NotificationType) => void;

  locationEnabled: boolean;
  setLocationEnabled: (v: boolean) => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [temperatureUnit, setTemperatureUnit] = useState<TemperatureUnit>('celsius');
  const [notificationType, setNotificationType] = useState<NotificationType>('push');
  const [locationEnabled, setLocationEnabled] = useState<boolean>(true);

  return (
    <SettingsContext.Provider
      value={{
        theme,
        setTheme,
        temperatureUnit,
        setTemperatureUnit,
        notificationType,
        setNotificationType,
        locationEnabled,
        setLocationEnabled,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used inside SettingsProvider');
  }
  return ctx;
};
