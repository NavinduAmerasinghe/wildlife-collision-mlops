import { useEffect, useState } from "react";

type AlertItem = {
  id: string;
  title: string;
  detail: string;
  severity: "high" | "medium" | "low" | "success";
};

const mockAlerts: AlertItem[] = [
  { id: "1", title: "High-risk prediction detected", detail: "Vehicle near forest edge — predicted high collision risk", severity: "high" },
  { id: "2", title: "Pipeline completed successfully", detail: "Full pipeline finished: bronze → silver → gold → train", severity: "success" },
  { id: "3", title: "Dataset uploaded successfully", detail: "wildlife_incidents.csv (19,302 rows)", severity: "medium" },
  { id: "4", title: "Model comparison completed", detail: "RandomForest selected as best model (AUC 0.89)", severity: "low" },
];

function SeverityBadge({ s }: { s: AlertItem["severity"] }) {
  const classes: Record<string, string> = {
    high: "bg-red-600 text-white",
    medium: "bg-yellow-400 text-black",
    low: "bg-orange-500 text-white",
    success: "bg-green-600 text-white",
  };
  return <span className={`px-2 py-0.5 rounded text-xs ${classes[s]}`}>{s.toUpperCase()}</span>;
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    let mounted = true;
    // try backend endpoints; if not available, fall back to mock alerts
    fetch('/api/dashboard/pipeline-status').then(r => {
      if (!mounted) return;
      if (!r.ok) {
        setAlerts(mockAlerts);
        return;
      }
      // for now, keep using mockAlerts as a safe default
      setAlerts(mockAlerts);
    }).catch(() => {
      if (mounted) setAlerts(mockAlerts);
    });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="p-6 w-full">
      <h2 className="text-white text-2xl font-semibold mb-4">Alerts</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alerts.map(a => (
          <div key={a.id} className="bg-[#0f0f18] p-4 rounded-lg border border-[rgba(255,255,255,0.04)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-white font-semibold">{a.title}</div>
                <div className="text-sm text-[#cfcfd8] mt-1">{a.detail}</div>
              </div>
              <div className="ml-auto">
                <SeverityBadge s={a.severity} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
