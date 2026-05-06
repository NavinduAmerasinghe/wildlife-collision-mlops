import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface Prediction {
  _id: string;
  response?: {
    risk_label: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface PredictionHistoryChartProps {
  predictions: Prediction[] | null | undefined;
}

export const PredictionHistoryChart: React.FC<PredictionHistoryChartProps> = ({
  predictions,
}) => {
  // Prepare chart data from predictions
  const chartData = useMemo(() => {
    if (!predictions || predictions.length === 0) {
      return [{ name: 'Risk Distribution', high_risk: 0, low_risk: 0 }];
    }

    let highRiskCount = 0;
    let lowRiskCount = 0;

    predictions.forEach((pred) => {
      const riskLabel = pred.response?.risk_label || '';
      if (riskLabel === 'high_risk') {
        highRiskCount++;
      } else if (riskLabel === 'low_risk') {
        lowRiskCount++;
      }
    });

    return [
      {
        name: 'Risk Distribution',
        high_risk: highRiskCount,
        low_risk: lowRiskCount,
      },
    ];
  }, [predictions]);

  // Check if we have any data
  const totalCount =
    chartData[0]?.high_risk || 0 + chartData[0]?.low_risk || 0;

  if (totalCount === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-slate-400">
        No chart data available yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
        <XAxis
          dataKey="name"
          stroke="#94a3b8"
          style={{ fontSize: '14px' }}
        />
        <YAxis
          stroke="#94a3b8"
          style={{ fontSize: '14px' }}
          label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #475569',
            borderRadius: '8px',
            color: '#e2e8f0',
          }}
          formatter={(value: number) => `${value} predictions`}
        />
        <Legend
          wrapperStyle={{ paddingTop: '20px', color: '#cbd5e1' }}
          iconType="square"
        />
        <Bar dataKey="high_risk" fill="#f87171" radius={[8, 8, 0, 0]} name="High Risk" />
        <Bar dataKey="low_risk" fill="#10b981" radius={[8, 8, 0, 0]} name="Low Risk" />
      </BarChart>
    </ResponsiveContainer>
  );
};
