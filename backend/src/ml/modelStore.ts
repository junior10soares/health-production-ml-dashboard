import fs from "fs";
import path from "path";
import type { LRWeights } from "./logisticRegression";

export interface ReferenceStats {
  centroid: number[];
  distanceMean: number;
  distanceStd: number;
  trainedAt: string;
  datasetSize: number;
}

const ARTIFACTS_DIR = path.join(__dirname, "../../artifacts");

function loadArtifact<T>(filename: string): T {
  const filePath = path.join(ARTIFACTS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Missing artifact ${filename}. Run "npm run train" in backend/ before starting the server.`,
    );
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

let weights: LRWeights | null = null;
let referenceStats: ReferenceStats | null = null;

export function getWeights(): LRWeights {
  if (!weights) {
    weights = loadArtifact<LRWeights>("model-weights.json");
  }
  return weights;
}

export function getReferenceStats(): ReferenceStats {
  if (!referenceStats) {
    referenceStats = loadArtifact<ReferenceStats>("reference-stats.json");
  }
  return referenceStats;
}
