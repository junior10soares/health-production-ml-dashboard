import type { HistoryResponse, PredictResponse, ReindexResponse, StatsResponse } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request to ${path} failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function predict(text: string): Promise<PredictResponse> {
  return request<PredictResponse>("/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
}

export function getStats(): Promise<StatsResponse> {
  return request<StatsResponse>("/stats");
}

export function getHistory(limit = 50): Promise<HistoryResponse> {
  return request<HistoryResponse>(`/history?limit=${limit}`);
}

export function triggerReindex(): Promise<ReindexResponse> {
  return request<ReindexResponse>("/reindex", { method: "POST" });
}
