"use client";

import { useCallback, useEffect, useState } from "react";
import { getHistory, getStats, triggerReindex } from "./lib/api";
import type { HistoryRecord, StatsResponse } from "./lib/types";
import { AlertBanner } from "./components/AlertBanner";
import { PredictForm } from "./components/PredictForm";
import { DriftChart } from "./components/DriftChart";
import { StatusPanel } from "./components/StatusPanel";
import { DriftInjectorButton } from "./components/DriftInjectorButton";

const POLL_INTERVAL_MS = 4000;
const HISTORY_LIMIT = 50;

export default function Home() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  const refresh = useCallback(async () => {
    try {
      const [statsRes, historyRes] = await Promise.all([
        getStats(),
        getHistory(HISTORY_LIMIT),
      ]);
      setStats(statsRes);
      setHistory(historyRes.records);
    } catch {
      // backend may be cold-starting; next poll tick will retry
    }
  }, []);

  useEffect(() => {
    // refresh() is async; its setState calls happen after the await boundary, not synchronously in this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  async function handleManualReindex() {
    await triggerReindex();
    await refresh();
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Live ML Model Health Dashboard</h1>

      <div className="mb-4">
        <AlertBanner active={stats?.alertActive ?? false} />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <PredictForm onResult={refresh} />
          <div className="flex gap-3">
            <DriftInjectorButton onInjected={refresh} />
            <button
              onClick={handleManualReindex}
              className="rounded border border-gray-300 px-4 py-2 text-sm font-medium"
            >
              Trigger Manual Reindex
            </button>
          </div>
        </div>
        <StatusPanel stats={stats} />
      </div>

      <DriftChart records={history} threshold={stats?.threshold ?? 0} />
    </div>
  );
}
