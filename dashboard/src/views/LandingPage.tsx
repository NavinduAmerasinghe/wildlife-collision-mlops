import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import "../styles/LandingPage.css";

export default function LandingPage() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animations on mount
    setIsVisible(true);
  }, []);

  const handleProceed = () => {
    navigate("/analytics");
  };

  return (
    <div className="landing-container">
      <div className={`landing-content ${isVisible ? "animate-in" : ""}`}>
        {/* Logo */}
        <div className="logo-wrapper">
          <img src={logo} alt="Wildlife Collision Risk Prediction System" className="logo-image" />
        </div>

        {/* Title */}
        <h1 className="title">WildLife <span className="nowrap">Collision Risk Prediction</span> System</h1>

        {/* Subtitle */}
        <p className="subtitle">Predict. Prevent. Protect</p>

        {/* Button */}
        <button className="proceed-button" onClick={handleProceed}>
          Proceed to Dashboard
        </button>
      </div>
    </div>
  );
}
