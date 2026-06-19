export interface PredictResponse {
  label: "positive" | "negative";
  confidence: number;
  driftDistance: number;
  threshold: number;
  isDriftFlagged: boolean;
  rollingAverageDrift: number;
  alertActive: boolean;
}

export interface StatsResponse {
  alertActive: boolean;
  rollingAverageDrift: number;
  threshold: number;
  totalQueriesProcessed: number;
  lastReindexAt: string | null;
  lastReindexTriggerType: "auto" | "manual" | null;
  rollingWindowSize: number;
}

export interface HistoryRecord {
  id: number;
  text: string;
  label: string;
  confidence: number;
  driftDistance: number;
  isDriftFlagged: boolean;
  createdAt: string;
}

export interface HistoryResponse {
  records: HistoryRecord[];
}

export interface ReindexResponse {
  success: true;
  triggerType: "auto" | "manual";
  newRollingAverageDrift: number;
  alertActive: boolean;
  reindexedAt: string;
}
