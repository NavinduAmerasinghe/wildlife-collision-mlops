import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Upload {
  _id: string;
  created_at: string;
  row_count: number;
  [key: string]: unknown;
}

interface DatasetUploadHistoryChartProps {
  uploads: Upload[] | null | undefined;
}

export const DatasetUploadHistoryChart: React.FC<
  DatasetUploadHistoryChartProps
> = ({ uploads }) => {
  // Prepare chart data from uploads
  const chartData = useMemo(() => {
    if (!uploads || uploads.length === 0) {
      return [];
    }

    // Sort by created_at ascending for chronological display
    const sorted = [...uploads].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    return sorted.map((upload) => ({
      timestamp: new Date(upload.created_at).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      row_count: upload.row_count,
      created_at: upload.created_at,
    }));
  }, [uploads]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-slate-400">
        No chart data available yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
        <XAxis
          dataKey="timestamp"
          stroke="#94a3b8"
          style={{ fontSize: '12px' }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis
          stroke="#94a3b8"
          style={{ fontSize: '14px' }}
          label={{ value: 'Row Count', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #475569',
            borderRadius: '8px',
            color: '#e2e8f0',
          }}
          formatter={(value: number) => [`${value.toLocaleString()} rows`, 'Uploaded']}
          labelFormatter={(label) => `Time: ${label}`}
        />
        <Legend wrapperStyle={{ paddingTop: '20px', color: '#cbd5e1' }} />
        <Line
          type="monotone"
          dataKey="row_count"
          stroke="#06b6d4"
          strokeWidth={3}
          dot={{ fill: '#06b6d4', r: 5 }}
          activeDot={{ r: 8 }}
          name="Dataset Row Count"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
