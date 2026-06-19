import type { StatsResponse } from "../lib/types";

interface StatusPanelProps {
  stats: StatsResponse | null;
}

function relativeTime(iso: string | null): string {
  if (!iso) return "never";
  const diffSeconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (diffSeconds < 60) return formatter.format(-diffSeconds, "second");
  if (diffSeconds < 3600) return formatter.format(-Math.round(diffSeconds / 60), "minute");
  return formatter.format(-Math.round(diffSeconds / 3600), "hour");
}

export function StatusPanel({ stats }: StatusPanelProps) {
  if (!stats) {
    return <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-500">Loading status...</div>;
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4 text-sm">
      <h2 className="mb-3 font-semibold">Status</h2>
      <dl className="grid grid-cols-2 gap-2">
        <dt className="text-gray-500">Total queries</dt>
        <dd className="text-right">{stats.totalQueriesProcessed}</dd>

        <dt className="text-gray-500">Threshold</dt>
        <dd className="text-right">{stats.threshold.toFixed(3)}</dd>

        <dt className="text-gray-500">Rolling avg. drift</dt>
        <dd className="text-right">{stats.rollingAverageDrift.toFixed(3)}</dd>

        <dt className="text-gray-500">Last reindex</dt>
        <dd className="text-right">
          {relativeTime(stats.lastReindexAt)}
          {stats.lastReindexTriggerType ? ` (${stats.lastReindexTriggerType})` : ""}
        </dd>
      </dl>
    </div>
  );
}
