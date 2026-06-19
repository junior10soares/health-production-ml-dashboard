import { Router } from "express";
import { embed } from "../ml/embeddings";
import { getWeights } from "../ml/modelStore";
import { predictProba } from "../ml/logisticRegression";
import { recordDrift } from "../drift/driftDetector";
import { canAutoReindex, performReindex } from "../drift/reindexService";
import { insertQuery } from "../db/connection";
import { asyncHandler } from "../asyncHandler";
import type { PredictRequest, PredictResponse } from "../types";

export const predictRouter = Router();

const MAX_TEXT_LENGTH = 2000;

predictRouter.post("/predict", asyncHandler(async (req, res) => {
  const body = req.body as PredictRequest;
  const text = typeof body?.text === "string" ? body.text.trim() : "";

  if (!text || text.length > MAX_TEXT_LENGTH) {
    res.status(400).json({ error: `text is required and must be 1-${MAX_TEXT_LENGTH} chars` });
    return;
  }

  const embedding = await embed(text);
  const weights = getWeights();
  const proba = predictProba(embedding, weights);
  const label = proba >= 0.5 ? "positive" : "negative";
  const confidence = label === "positive" ? proba : 1 - proba;

  const drift = recordDrift(embedding);

  await insertQuery({
    text,
    label,
    confidence,
    driftDistance: drift.driftDistance,
    isDriftFlagged: drift.isDriftFlagged,
  });

  if (drift.sustainedDrift && canAutoReindex()) {
    performReindex("auto").catch((err) => console.error("Auto-reindex failed:", err));
  }

  const response: PredictResponse = {
    label,
    confidence,
    driftDistance: drift.driftDistance,
    threshold: drift.threshold,
    isDriftFlagged: drift.isDriftFlagged,
    rollingAverageDrift: drift.rollingAverageDrift,
    alertActive: drift.alertActive,
  };

  res.json(response);
}));
