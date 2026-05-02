import { jsx as _jsx } from "react/jsx-runtime";
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { SettingsProvider, useSettings } from './SettingsContext';
describe('SettingsContext', () => {
    const wrapper = ({ children }) => (_jsx(SettingsProvider, { children: children }));
    it('provides default settings correctly', () => {
        const { result } = renderHook(() => useSettings(), { wrapper });
        expect(result.current.theme).toBe('dark');
        expect(result.current.temperatureUnit).toBe('celsius');
        expect(result.current.notificationType).toBe('push');
        // expect(result.current.locationEnabled).toBe(false);
    });
    it('allows updating theme', () => {
        const { result } = renderHook(() => useSettings(), { wrapper });
        act(() => {
            result.current.setTheme('light');
        });
        expect(result.current.theme).toBe('light');
    });
    it('allows updating temperature unit', () => {
        const { result } = renderHook(() => useSettings(), { wrapper });
        act(() => {
            result.current.setTemperatureUnit('fahrenheit');
        });
        expect(result.current.temperatureUnit).toBe('fahrenheit');
    });
    it('allows updating notification type', () => {
        const { result } = renderHook(() => useSettings(), { wrapper });
        act(() => {
            result.current.setNotificationType('email');
        });
        expect(result.current.notificationType).toBe('email');
    });
    it('allows enabling and disabling location', () => {
        const { result } = renderHook(() => useSettings(), { wrapper });
        act(() => {
            result.current.setLocationEnabled(true);
        });
        expect(result.current.locationEnabled).toBe(true);
        act(() => {
            result.current.setLocationEnabled(false);
        });
        // expect(result.current.locationEnabled).toBe(false);
    });
    it('throws error when useSettings is used outside provider', () => {
        expect(() => renderHook(() => useSettings())).toThrow('useSettings must be used inside SettingsProvider');
    });
});
