"use client";

import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HistoryRecord } from "../lib/types";

interface DriftChartProps {
  records: HistoryRecord[];
  threshold: number;
}

export function DriftChart({ records, threshold }: DriftChartProps) {
  const data = records.map((r) => ({
    time: new Date(r.createdAt).toLocaleTimeString(),
    driftDistance: r.driftDistance,
  }));

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h2 className="mb-3 text-sm font-semibold">Drift Distance Over Time</h2>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <XAxis dataKey="time" tick={{ fontSize: 10 }} />
          <YAxis domain={[0, 1]} tick={{ fontSize: 10 }} />
          <Tooltip />
          <ReferenceLine y={threshold} stroke="#dc2626" strokeDasharray="4 4" label="threshold" />
          <Area
            type="monotone"
            dataKey="driftDistance"
            stroke="#2563eb"
            fill="#bfdbfe"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
