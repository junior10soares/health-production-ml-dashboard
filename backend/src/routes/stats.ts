import { Router } from "express";
import { getQueryCount, getLastReindexEvent } from "../db/connection";
import { isAlertActive, getRollingAverage, getThreshold, getRollingWindow } from "../drift/driftDetector";
import { asyncHandler } from "../asyncHandler";
import type { StatsResponse } from "../types";

export const statsRouter = Router();

statsRouter.get("/stats", asyncHandler(async (_req, res) => {
  const [totalQueriesProcessed, lastReindexEvent] = await Promise.all([
    getQueryCount(),
    getLastReindexEvent(),
  ]);

  const response: StatsResponse = {
    alertActive: isAlertActive(),
    rollingAverageDrift: getRollingAverage(),
    threshold: getThreshold(),
    totalQueriesProcessed,
    lastReindexAt: lastReindexEvent?.createdAt ?? null,
    lastReindexTriggerType: lastReindexEvent?.triggerType ?? null,
    rollingWindowSize: getRollingWindow().length,
  };

  res.json(response);
}));
