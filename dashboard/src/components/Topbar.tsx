//Topbar.tsx
import React, { useState, useEffect } from "react";
import SettingsIcon from "@mui/icons-material/Settings";
import { useSettings } from "../views/SettingsContext";
import { useHomeState } from '../redux/storeHooks';
import SettingsModal from "./SettingsModal";

const Topbar: React.FC = () => {

  const { locationEnabled } = useSettings();
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useHomeState('location');

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

      <SettingsModal open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default Topbar;
