import { Database, Gauge, Activity, RefreshCw } from "lucide-react";
import type { StatsResponse } from "../lib/types";

interface StatusPanelProps {
  stats: StatsResponse | null;
}

function relativeTime(iso: string | null): string {
  if (!iso) return "nunca";
  const diffSeconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
  if (diffSeconds < 60) return formatter.format(-diffSeconds, "second");
  if (diffSeconds < 3600) return formatter.format(-Math.round(diffSeconds / 60), "minute");
  return formatter.format(-Math.round(diffSeconds / 3600), "hour");
}

const TRIGGER_PT: Record<string, string> = {
  auto: "automático",
  manual: "manual",
};

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accent}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-100">{value}</p>
      </div>
    </div>
  );
}

export function StatusPanel({ stats }: StatusPanelProps) {
  if (!stats) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-500 shadow-xl backdrop-blur">
        Carregando status...
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <Activity className="h-4 w-4 text-indigo-400" />
        Status do Sistema
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Database className="h-4 w-4 text-indigo-300" />}
          accent="bg-indigo-500/10"
          label="Total de consultas"
          value={String(stats.totalQueriesProcessed)}
        />
        <StatCard
          icon={<Gauge className="h-4 w-4 text-violet-300" />}
          accent="bg-violet-500/10"
          label="Limiar de drift"
          value={stats.threshold.toFixed(3)}
        />
        <StatCard
          icon={<Activity className="h-4 w-4 text-amber-300" />}
          accent="bg-amber-500/10"
          label="Média móvel de drift"
          value={stats.rollingAverageDrift.toFixed(3)}
        />
        <StatCard
          icon={<RefreshCw className="h-4 w-4 text-emerald-300" />}
          accent="bg-emerald-500/10"
          label="Último reindex"
          value={
            stats.lastReindexTriggerType
              ? `${relativeTime(stats.lastReindexAt)} (${TRIGGER_PT[stats.lastReindexTriggerType]})`
              : relativeTime(stats.lastReindexAt)
          }
        />
      </div>
    </div>
  );
}
