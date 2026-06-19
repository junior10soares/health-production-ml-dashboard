import { embed } from "../ml/embeddings";
import { getRecentQueries, insertReindexEvent } from "../db/connection";
import {
  getCurrentCentroid,
  setCurrentCentroid,
  getRollingAverage,
  resetAfterReindex,
} from "./driftDetector";
import { REINDEX_BLEND_WEIGHT, REINDEX_DEBOUNCE_MS, ROLLING_WINDOW_SIZE } from "../config";

let lastReindexTimestamp = 0;

function meanVector(vectors: number[][]): number[] {
  const dim = vectors[0].length;
  const mean = new Array(dim).fill(0);
  for (const v of vectors) {
    for (let i = 0; i < dim; i++) mean[i] += v[i];
  }
  for (let i = 0; i < dim; i++) mean[i] /= vectors.length;
  return mean;
}

function lerp(a: number[], b: number[], weight: number): number[] {
  return a.map((value, i) => value * (1 - weight) + b[i] * weight);
}

export function canAutoReindex(): boolean {
  return Date.now() - lastReindexTimestamp > REINDEX_DEBOUNCE_MS;
}

export async function performReindex(triggerType: "auto" | "manual"): Promise<{
  preAvgDrift: number;
  blendedWindowSize: number;
}> {
  const recent = await getRecentQueries(ROLLING_WINDOW_SIZE);
  const preAvgDrift = getRollingAverage();

  if (recent.length > 0) {
    const recentEmbeddings = await Promise.all(recent.map((row) => embed(row.text)));
    const recentMean = meanVector(recentEmbeddings);
    const newCentroid = lerp(getCurrentCentroid(), recentMean, REINDEX_BLEND_WEIGHT);
    setCurrentCentroid(newCentroid);
  }

  resetAfterReindex();
  lastReindexTimestamp = Date.now();

  await insertReindexEvent({
    triggerType,
    preAvgDrift,
    blendedWindowSize: recent.length,
  });

  return { preAvgDrift, blendedWindowSize: recent.length };
}
