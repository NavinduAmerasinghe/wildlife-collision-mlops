import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function ViewContainer() {
  return (
    <div className="flex flex-col w-full h-full overflow-y-hidden">
      <Topbar />
      <div className="flex w-full h-full">
      <Sidebar />
      <div className="flex w-full h-full items-center justify-center" >
        <Outlet />
      </div>
      </div>
    </div>
  );
}