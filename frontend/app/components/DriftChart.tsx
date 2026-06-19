"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LineChart } from "lucide-react";
import type { HistoryRecord } from "../lib/types";

interface DriftChartProps {
  records: HistoryRecord[];
  threshold: number;
}

export function DriftChart({ records, threshold }: DriftChartProps) {
  const data = records.map((r) => ({
    time: new Date(r.createdAt).toLocaleTimeString("pt-BR"),
    driftDistance: r.driftDistance,
  }));

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <LineChart className="h-4 w-4 text-indigo-400" />
        Distância de Drift ao Longo do Tempo
      </h2>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="driftFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#818cf8" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#64748b" }} stroke="#334155" />
          <YAxis domain={[0, 1]} tick={{ fontSize: 10, fill: "#64748b" }} stroke="#334155" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #334155",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#cbd5e1" }}
          />
          <ReferenceLine
            y={threshold}
            stroke="#fb7185"
            strokeDasharray="4 4"
            label={{ value: "limiar", position: "insideTopRight", fill: "#fb7185", fontSize: 11 }}
          />
          <Area
            type="monotone"
            dataKey="driftDistance"
            stroke="#818cf8"
            strokeWidth={2}
            fill="url(#driftFill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
