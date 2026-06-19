import { getReferenceStats } from "../ml/modelStore";
import { MIN_WINDOW_FOR_ALERT, ROLLING_WINDOW_SIZE, DRIFT_THRESHOLD_K } from "../config";

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function cosineDistance(a: number[], b: number[]): number {
  return 1 - cosineSimilarity(a, b);
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((acc, v) => acc + v, 0) / values.length;
}

interface DriftState {
  rollingWindow: number[];
  isAlertActive: boolean;
  currentCentroid: number[];
}

const referenceStats = getReferenceStats();

const state: DriftState = {
  rollingWindow: [],
  isAlertActive: false,
  currentCentroid: [...referenceStats.centroid],
};

export function getThreshold(): number {
  return referenceStats.distanceMean + DRIFT_THRESHOLD_K * referenceStats.distanceStd;
}

export function getCurrentCentroid(): number[] {
  return state.currentCentroid;
}

export function setCurrentCentroid(centroid: number[]): void {
  state.currentCentroid = centroid;
}

export function isAlertActive(): boolean {
  return state.isAlertActive;
}

export function getRollingWindow(): number[] {
  return state.rollingWindow;
}

export function getRollingAverage(): number {
  return average(state.rollingWindow);
}

export interface RecordDriftResult {
  driftDistance: number;
  threshold: number;
  isDriftFlagged: boolean;
  rollingAverageDrift: number;
  sustainedDrift: boolean;
  alertActive: boolean;
}

export function recordDrift(embedding: number[]): RecordDriftResult {
  const threshold = getThreshold();
  const driftDistance = cosineDistance(embedding, state.currentCentroid);
  const isDriftFlagged = driftDistance > threshold;

  state.rollingWindow.push(driftDistance);
  if (state.rollingWindow.length > ROLLING_WINDOW_SIZE) {
    state.rollingWindow.shift();
  }

  const rollingAverageDrift = getRollingAverage();
  const sustainedDrift =
    state.rollingWindow.length >= MIN_WINDOW_FOR_ALERT && rollingAverageDrift > threshold;

  if (sustainedDrift) {
    state.isAlertActive = true;
  }

  return {
    driftDistance,
    threshold,
    isDriftFlagged,
    rollingAverageDrift,
    sustainedDrift,
    alertActive: state.isAlertActive,
  };
}

export function resetAfterReindex(): void {
  state.rollingWindow = [];
  state.isAlertActive = false;
}
