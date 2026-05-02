import { NavLink, NavLinkProps } from "react-router-dom";

const navLinkClass: NavLinkProps["className"] = ({ isActive }) => {
  return `
    block py-5 pl-[10px] no-underline border-b border-black
    ${isActive ? "text-white font-bold" : "text-[#b8b8ce]"}
  `;
}

export default function Sidebar() {
  return (
    <div className="w-[22%] bg-[#1e1e2f] text-white flex flex-col text-[20px]">
      <nav>
        <NavLink className={navLinkClass} to="/" end>Home Dashboard Overview</NavLink>
        <NavLink className={navLinkClass} to="/location" end>Location-Based Insights</NavLink>
        <NavLink className={navLinkClass} to="/analytics" end>Analytics & Route Prediction</NavLink>
        <NavLink className={navLinkClass} to="/liveTraffic" end>Smart Road Weather & Traffic Pred</NavLink>
      </nav>
    </div>
  );
}