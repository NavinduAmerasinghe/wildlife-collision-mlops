
import { useState } from "react";
import { NavLink } from "react-router-dom";
import SettingsModal from "./SettingsModal";
import logo from "../assets/logo.png";
import { useSettings } from "../views/SettingsContext";

const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "group flex items-center gap-3 px-3 py-3 rounded-2xl font-medium text-[13px] no-underline transition-all duration-200 border border-transparent",
    isActive
      ? "bg-white/10 text-[#f3f4ff] border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.18)] translate-x-0.5"
      : "text-slate-300/80 hover:bg-white/5 hover:text-white hover:border-white/10",
  ].join(" ");

function NavIconAnalytics() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7c7cff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><rect x="3" y="12" width="4" height="8" rx="1.5"/><rect x="9.5" y="8" width="4" height="12" rx="1.5"/><rect x="16" y="4" width="4" height="16" rx="1.5"/></svg>
  );
}
function NavIconTraffic() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7c7cff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M7 17V7a5 5 0 0 1 10 0v10"/><rect x="5" y="17" width="14" height="4" rx="2"/></svg>
  );
}
function NavIconSettings() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8888aa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  );
}

const systemName = "Wildlife Pulse";

export default function Sidebar() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { userRole } = useSettings();
  const NavContents = (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/70 shadow-lg shadow-indigo-900/20 overflow-hidden">
          <img src={logo} alt={systemName} className="h-full w-full object-contain p-1.5" />
        </div>
        <div className="leading-tight">
          <div className="text-[14px] font-semibold text-slate-100 tracking-wide">{systemName}</div>
          <div className="text-[11px] tracking-[0.28em] text-slate-400 uppercase">Control Center</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-5 text-[20px]">
        {userRole === "admin" && (
          <>
            <NavLink className={getNavLinkClass} to="/analytics" end>
              <NavIconAnalytics /> Analytics Overview
            </NavLink>
            <NavLink className={getNavLinkClass} to="/liveTraffic" end>
              <NavIconTraffic /> Traffic & Weather
            </NavLink>
          </>
        )}

        <div className="my-4 border-t border-white/10" />
        <div className="px-2 pb-3 text-[11px] font-semibold text-slate-400 tracking-[0.28em] uppercase">Live Monitoring</div>
        <NavLink className={getNavLinkClass} to="/routePrediction" end>
          <NavIconTraffic /> Route Risk Forecasts
        </NavLink>
        <NavLink className={getNavLinkClass} to="/envMonitor" end>
          <NavIconTraffic /> Environment Monitor
        </NavLink>
      </nav>

      {/* Logo Watermark */}
        <div className="mt-4 flex justify-center px-4 opacity-40 hover:opacity-70 transition-opacity duration-200">
          <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-sm">
            <img src={logo} alt="System Logo" className="max-w-[120px] h-auto" />
          </div>
      </div>

      {/* Footer */}
        <div className="px-5 py-5 border-t border-white/10 flex flex-col gap-4 text-[18px] bg-white/5 backdrop-blur-sm">
        <button
          className={getNavLinkClass({ isActive: false })}
          type="button"
          onClick={() => setSettingsOpen(true)}
        >
          <NavIconSettings /> Settings
        </button>
          <div className="flex items-center gap-3 mt-2 rounded-2xl border border-white/10 bg-black/10 px-3 py-3">
            <div className="w-[38px] h-[38px] rounded-full bg-linear-to-tr from-indigo-500 via-sky-400 to-cyan-300 flex items-center justify-center shadow-md shadow-indigo-950/20">
            <span className="text-white font-bold text-[18px]">U</span>
          </div>
          <div className="flex flex-col">
              <span className="text-slate-100 text-[16px] font-medium leading-tight">Uusimaa Region</span>
              <span className="text-slate-400 text-[13px] leading-tight">Active monitoring</span>
          </div>
          <span className="ml-auto w-2 h-2 rounded-full bg-green-500" />
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-3 rounded-2xl bg-slate-950/85 text-white shadow-[0_12px_30px_rgba(0,0,0,0.35)] border border-white/10 backdrop-blur-md"
        aria-label="Open navigation"
        onClick={() => setMobileOpen(true)}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 h-full bg-slate-950/95 flex flex-col text-white text-[18px] select-none shadow-[0_20px_60px_rgba(0,0,0,0.45)] border-r border-white/10">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/70 overflow-hidden">
                    <img src={logo} alt={systemName} className="h-full w-full object-contain p-1.5" />
                  </div>
                  <div className="leading-tight">
                    <div className="text-[13px] font-semibold text-slate-100 tracking-wide">{systemName}</div>
                    <div className="text-[10px] tracking-[0.28em] text-slate-400 uppercase">Control Center</div>
                  </div>
                </div>
              <button onClick={() => setMobileOpen(false)} aria-label="Close navigation" className="p-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            {NavContents}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-[22%] min-w-[230px] max-w-[340px] h-full text-white text-[18px] select-none bg-slate-950/90 border-r border-white/10 shadow-[12px_0_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
        <div className="flex h-full flex-col">{NavContents}</div>
      </aside>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}