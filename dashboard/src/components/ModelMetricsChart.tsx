import React from 'react';
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

interface ModelMetric {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
}

interface ModelMetricsChartProps {
  logisticRegression: ModelMetric | null | undefined;
  randomForest: ModelMetric | null | undefined;
}

export const ModelMetricsChart: React.FC<ModelMetricsChartProps> = ({
  logisticRegression,
  randomForest,
}) => {
  // Convert metrics to percentage and prepare chart data
  const chartData = [
    {
      name: 'Accuracy',
      'Logistic Regression': logisticRegression?.accuracy
        ? Math.round(logisticRegression.accuracy * 100)
        : 0,
      'Random Forest': randomForest?.accuracy
        ? Math.round(randomForest.accuracy * 100)
        : 0,
    },
    {
      name: 'Precision',
      'Logistic Regression': logisticRegression?.precision
        ? Math.round(logisticRegression.precision * 100)
        : 0,
      'Random Forest': randomForest?.precision
        ? Math.round(randomForest.precision * 100)
        : 0,
    },
    {
      name: 'Recall',
      'Logistic Regression': logisticRegression?.recall
        ? Math.round(logisticRegression.recall * 100)
        : 0,
      'Random Forest': randomForest?.recall
        ? Math.round(randomForest.recall * 100)
        : 0,
    },
    {
      name: 'F1 Score',
      'Logistic Regression': logisticRegression?.f1_score
        ? Math.round(logisticRegression.f1_score * 100)
        : 0,
      'Random Forest': randomForest?.f1_score
        ? Math.round(randomForest.f1_score * 100)
        : 0,
    },
  ];

  // Check if we have any data
  const hasData = chartData.some(
    (d) => d['Logistic Regression'] > 0 || d['Random Forest'] > 0
  );

  if (!hasData) {
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
          label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #475569',
            borderRadius: '8px',
            color: '#e2e8f0',
          }}
          formatter={(value: number) => `${value}%`}
        />
        <Legend
          wrapperStyle={{ paddingTop: '20px', color: '#cbd5e1' }}
          iconType="square"
        />
        <Bar dataKey="Logistic Regression" fill="#06b6d4" radius={[8, 8, 0, 0]} />
        <Bar dataKey="Random Forest" fill="#10b981" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};
