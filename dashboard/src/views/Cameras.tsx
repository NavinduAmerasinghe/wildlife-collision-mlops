import { useMemo } from "react";

type Camera = {
  camera_id: string;
  location: string;
  status: string;
  last_detection: string;
  risk_level: "Low" | "Medium" | "High";
  confidence: number;
};

const staticCameras: Camera[] = [
  { camera_id: "CAM-001", location: "Main St / A1", status: "online", last_detection: "2026-05-06 10:12", risk_level: "Low", confidence: 0.45 },
  { camera_id: "CAM-002", location: "Forest Rd / B2", status: "online", last_detection: "2026-05-06 11:03", risk_level: "High", confidence: 0.92 },
  { camera_id: "CAM-003", location: "Bridge Ave / C3", status: "offline", last_detection: "2026-05-05 18:41", risk_level: "Medium", confidence: 0.67 },
];

export default function Cameras() {
  const cams = useMemo(() => staticCameras, []);

  return (
    <div className="p-6">
      <h2 className="text-white text-2xl font-semibold mb-4">Cameras (Simulated)</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cams.map((c) => (
          <div key={c.camera_id} className="bg-[#0f0f18] p-4 rounded-lg border border-[rgba(255,255,255,0.04)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[#c5c5ff] font-medium">{c.camera_id}</div>
                <div className="text-sm text-[#d7d7df]">{c.location}</div>
              </div>
              <div className={`text-sm px-2 py-1 rounded ${c.status === 'online' ? 'bg-green-600' : 'bg-gray-600' }`}>{c.status}</div>
            </div>
            <div className="mt-3 text-sm text-[#cfcfd8]">
              <div>Last detection: <span className="font-medium">{c.last_detection}</span></div>
              <div>Risk level: <span className="font-medium">{c.risk_level}</span></div>
              <div>Confidence: <span className="font-medium">{Math.round(c.confidence * 100)}%</span></div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-sm text-[#aeb0b8]">Camera module represents future integration with roadside AI surveillance.</div>
    </div>
  );
}
