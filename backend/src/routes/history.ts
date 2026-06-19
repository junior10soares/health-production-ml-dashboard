import { Router } from "express";
import { getRecentQueries } from "../db/connection";
import { asyncHandler } from "../asyncHandler";
import type { HistoryResponse } from "../types";

export const historyRouter = Router();

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

historyRouter.get("/history", asyncHandler(async (req, res) => {
  const requestedLimit = Number(req.query.limit ?? DEFAULT_LIMIT);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(1, requestedLimit), MAX_LIMIT)
    : DEFAULT_LIMIT;

  const rows = await getRecentQueries(limit);

  const response: HistoryResponse = {
    records: rows.map((row) => ({
      id: row.id,
      text: row.text,
      label: row.label,
      confidence: row.confidence,
      driftDistance: row.driftDistance,
      isDriftFlagged: row.isDriftFlagged,
      createdAt: row.createdAt,
    })),
  };

  res.json(response);
}));
