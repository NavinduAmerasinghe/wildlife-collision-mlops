import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";


export default function ViewContainer() {
  return (
    <div className="flex w-full h-screen"> 
      <Sidebar />
      <main className="flex-1 overflow-y-auto"> 
        <div className="min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}