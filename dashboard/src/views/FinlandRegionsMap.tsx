import React from "react";

interface Props {
  selectedRegion: string | null;
}

const ACTIVE = "#4ade80";
const INACTIVE = "#d1d5db";

const REGION_MAP: Record<string, string> = {
  "Uusimaa": "FI-18",
  "Varsinais-Suomi": "FI-19",
  "Satakunta": "FI-17",
  "Kanta-Häme": "FI-06",
  "Pirkanmaa": "FI-11",
  "Päijät-Häme": "FI-07",
  "Kymenlaakso": "FI-08",
  "Etelä-Karjala": "FI-09",
  "Etelä-Savo": "FI-05",
  "Pohjois-Savo": "FI-13",
  "Pohjois-Karjala": "FI-14",
  "Keski-Suomi": "FI-12",
  "Etelä-Pohjanmaa": "FI-03",
  "Pohjanmaa": "FI-15",
  "Keski-Pohjanmaa": "FI-16",
  "Pohjois-Pohjanmaa": "FI-31",
  "Kainuu": "FI-10",
  "Lappi": "FI-01",
  "Åland": "FI-21"
};

const FinlandRegionsMap: React.FC<Props> = ({ selectedRegion }) => {
  const activeId = selectedRegion ? REGION_MAP[selectedRegion] : null;

  return (
    <svg
      viewBox="0 0 600 1200"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
    >

      <path id="FI-21" d="M65 960 L110 940 L140 970 L120 1000 Z"
        fill={activeId === "FI-21" ? ACTIVE : INACTIVE} stroke="#333"/>

      <path id="FI-18" d="M280 880 L360 850 L390 910 L320 940 Z"
        fill={activeId === "FI-18" ? ACTIVE : INACTIVE} stroke="#333"/>

      <path id="FI-19" d="M210 880 L260 830 L295 880 L240 920 Z"
        fill={activeId === "FI-19" ? ACTIVE : INACTIVE} stroke="#333"/>

      <path id="FI-17" d="M200 760 L260 720 L290 780 L240 820 Z"
        fill={activeId === "FI-17" ? ACTIVE : INACTIVE} stroke="#333"/>

      <path id="FI-06" d="M300 820 L350 800 L370 830 L330 860 Z"
        fill={activeId === "FI-06" ? ACTIVE : INACTIVE} stroke="#333"/>

      <path id="FI-11" d="M260 760 L330 720 L360 780 L300 820 Z"
        fill={activeId === "FI-11" ? ACTIVE : INACTIVE} stroke="#333"/>

      <path id="FI-07" d="M360 800 L400 780 L420 820 L380 840 Z"
        fill={activeId === "FI-07" ? ACTIVE : INACTIVE} stroke="#333"/>

      <path id="FI-08" d="M400 850 L445 810 L460 850 L420 880 Z"
        fill={activeId === "FI-08" ? ACTIVE : INACTIVE} stroke="#333"/>

      <path id="FI-09" d="M410 820 L455 780 L480 820 L430 860 Z"
        fill={activeId === "FI-09" ? ACTIVE : INACTIVE} stroke="#333"/>

      <path id="FI-05" d="M380 720 L430 700 L460 740 L410 760 Z"
        fill={activeId === "FI-05" ? ACTIVE : INACTIVE} stroke="#333"/>

      <path id="FI-13" d="M360 620 L420 590 L460 650 L400 680 Z"
        fill={activeId === "FI-13" ? ACTIVE : INACTIVE} stroke="#333"/>

      <path id="FI-14" d="M430 630 L500 600 L530 660 L470 690 Z"
        fill={activeId === "FI-14" ? ACTIVE : INACTIVE} stroke="#333"/>

      <path id="FI-12" d="M290 650 L350 620 L380 680 L320 710 Z"
        fill={activeId === "FI-12" ? ACTIVE : INACTIVE} stroke="#333"/>

      <path id="FI-03" d="M230 650 L280 610 L300 660 L250 690 Z"
        fill={activeId === "FI-03" ? ACTIVE : INACTIVE} stroke="#333"/>

      <path id="FI-15" d="M200 600 L250 560 L270 620 L225 650 Z"
        fill={activeId === "FI-15" ? ACTIVE : INACTIVE} stroke="#333"/>

      <path id="FI-16" d="M230 560 L270 530 L290 580 L250 610 Z"
        fill={activeId === "FI-16" ? ACTIVE : INACTIVE} stroke="#333"/>

      <path id="FI-31" d="M260 470 L330 430 L360 500 L300 540 Z"
        fill={activeId === "FI-31" ? ACTIVE : INACTIVE} stroke="#333"/>

      <path id="FI-10" d="M350 500 L410 470 L440 530 L380 560 Z"
        fill={activeId === "FI-10" ? ACTIVE : INACTIVE} stroke="#333"/>

      <path id="FI-01" d="M250 250 L350 180 L430 270 L330 360 Z"
        fill={activeId === "FI-01" ? ACTIVE : INACTIVE} stroke="#333"/>
    </svg>
  );
};

export default FinlandRegionsMap;
