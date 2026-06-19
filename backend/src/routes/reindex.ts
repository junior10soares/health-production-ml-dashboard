import { Router } from "express";
import { performReindex } from "../drift/reindexService";
import { isAlertActive, getRollingAverage } from "../drift/driftDetector";
import { asyncHandler } from "../asyncHandler";
import type { ReindexResponse } from "../types";

export const reindexRouter = Router();

reindexRouter.post("/reindex", asyncHandler(async (_req, res) => {
  await performReindex("manual");

  const response: ReindexResponse = {
    success: true,
    triggerType: "manual",
    newRollingAverageDrift: getRollingAverage(),
    alertActive: isAlertActive(),
    reindexedAt: new Date().toISOString(),
  };

  res.json(response);
}));
