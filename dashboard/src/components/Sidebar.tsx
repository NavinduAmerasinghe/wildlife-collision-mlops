
import { useState } from "react";
import { NavLink, NavLinkProps } from "react-router-dom";
import SettingsModal from "./SettingsModal";

const navLinkClass: NavLinkProps["className"] = ({ isActive }) =>
  [
    "flex items-center gap-2 px-[12px] py-[10px] rounded-[8px] font-medium text-[13px] no-underline transition-colors border-0",
    isActive
      ? "bg-[rgba(124,124,255,0.12)] text-[#c5c5ff] font-medium"
      : "text-[#8888aa] hover:bg-[rgba(255,255,255,0.05)]",
  ].join(" ");

function PurpleDot() {
  return (
    <span className="ml-auto w-[6px] h-[6px] rounded-full bg-[#7c7cff]" />
  );
}

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
function NavIconAlert() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ff5a5a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M12 9v4"/><circle cx="12" cy="17" r="1"/><path d="M5.07 19H18.93a2 2 0 0 0 1.73-3l-6.93-12a2 2 0 0 0-3.46 0l-6.93 12A2 2 0 0 0 5.07 19z"/></svg>
  );
}
function NavIconCamera() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7c7cff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
  );
}
function NavIconSettings() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8888aa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  );
}
function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7c7cff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="ml-2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
  );
}

export default function Sidebar() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <aside className="w-[22%] min-w-[220px] max-w-[320px] h-full bg-[#12121f] flex flex-col text-white text-[13px] select-none">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
        <span className="text-[11px] tracking-widest text-[#7c7cff] font-semibold flex items-center gap-2">
          NAVIGATION <SunIcon />
        </span>
      </div>

      {/* Nav section */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <NavLink className={navLinkClass} to="/analytics" end>
          <NavIconAnalytics /> Analytics & Route Prediction
          {({ isActive }) => isActive && <PurpleDot />}
        </NavLink>
        <NavLink className={navLinkClass} to="/liveTraffic" end>
          <NavIconTraffic /> Smart Road Weather & Traffic Pred
          {({ isActive }) => isActive && <PurpleDot />}
        </NavLink>

        {/* Divider and Monitoring section */}
        <div className="my-3 border-t border-[rgba(255,255,255,0.06)]" />
        <div className="px-2 pb-1 text-[10px] font-semibold text-[#44445a] tracking-widest">MONITORING</div>
        <NavLink className={navLinkClass} to="/alerts" end>
          <NavIconAlert /> Alerts
          <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#ff5a5a] text-white">2</span>
          {({ isActive }) => isActive && <PurpleDot />}
        </NavLink>
        <NavLink className={navLinkClass} to="/cameras" end>
          <NavIconCamera /> Cameras
          {({ isActive }) => isActive && <PurpleDot />}
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[rgba(255,255,255,0.06)] flex flex-col gap-2">
        <button
          className={navLinkClass({ isActive: false })}
          type="button"
          onClick={() => setSettingsOpen(true)}
        >
          <NavIconSettings /> Settings
        </button>
        <div className="flex items-center gap-3 mt-2">
          <div className="w-[28px] h-[28px] rounded-full bg-gradient-to-tr from-[#7c7cff] to-[#c5c5ff] flex items-center justify-center">
            <span className="text-white font-bold text-[13px]">U</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#c5c5ff] text-[13px] font-medium leading-tight">Uusimaa Region</span>
            <span className="text-[#44445a] text-[11px] leading-tight">Active monitoring</span>
          </div>
          <span className="ml-auto w-[8px] h-[8px] rounded-full bg-green-500" />
        </div>
      </div>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </aside>
  );
}