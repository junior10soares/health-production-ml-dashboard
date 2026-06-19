"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, RefreshCw, BrainCircuit } from "lucide-react";
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
  const [reindexing, setReindexing] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [statsRes, historyRes] = await Promise.all([
        getStats(),
        getHistory(HISTORY_LIMIT),
      ]);
      setStats(statsRes);
      setHistory(historyRes.records);
    } catch {
      // backend pode estar em cold-start; o próximo ciclo de polling tenta de novo
    }
  }, []);

  useEffect(() => {
    // refresh() é assíncrona; suas chamadas de setState ocorrem após o await, não de forma síncrona neste efeito.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  async function handleManualReindex() {
    setReindexing(true);
    try {
      await triggerReindex();
      await refresh();
    } finally {
      setReindexing(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.15),_transparent_60%)]">
      <div className="mx-auto max-w-5xl p-6">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-900/40">
              <BrainCircuit className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Painel de Saúde do Modelo</h1>
              <p className="text-xs text-slate-400">
                Treinamento → Deploy → Monitoramento de Drift → Resposta Automática
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Monitorando em tempo real
          </div>
        </header>

        <div className="mb-4">
          <AlertBanner active={stats?.alertActive ?? false} />
        </div>

        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <PredictForm onResult={refresh} />
            <div className="flex flex-wrap gap-3">
              <DriftInjectorButton onInjected={refresh} />
              <motion.button
                onClick={handleManualReindex}
                disabled={reindexing}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${reindexing ? "animate-spin" : ""}`} />
                Disparar Reindexação Manual
              </motion.button>
            </div>
          </div>
          <StatusPanel stats={stats} />
        </div>

        <DriftChart records={history} threshold={stats?.threshold ?? 0} />

        <footer className="mt-6 flex items-center gap-2 text-xs text-slate-500">
          <Activity className="h-3.5 w-3.5" />
          Reindexação é uma simulação de re-baseline do centróide de referência, não um
          retreino completo do modelo.
        </footer>
      </div>
    </div>
  );
}
