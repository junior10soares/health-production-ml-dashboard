import fs from "fs";
import path from "path";
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Copy backend/.env.example to backend/.env and fill it in.");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function runMigrations(): Promise<void> {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");
  await pool.query(schema);
}

export interface QueryRecord {
  id: number;
  text: string;
  label: string;
  confidence: number;
  driftDistance: number;
  isDriftFlagged: boolean;
  createdAt: string;
}

export interface ReindexEventRecord {
  id: number;
  triggerType: "auto" | "manual";
  preAvgDrift: number;
  blendedWindowSize: number;
  createdAt: string;
}

export async function insertQuery(row: {
  text: string;
  label: string;
  confidence: number;
  driftDistance: number;
  isDriftFlagged: boolean;
}): Promise<void> {
  await pool.query(
    `INSERT INTO queries (text, label, confidence, drift_distance, is_drift_flagged)
     VALUES ($1, $2, $3, $4, $5)`,
    [row.text, row.label, row.confidence, row.driftDistance, row.isDriftFlagged],
  );
}

export async function insertReindexEvent(row: {
  triggerType: "auto" | "manual";
  preAvgDrift: number;
  blendedWindowSize: number;
}): Promise<void> {
  await pool.query(
    `INSERT INTO reindex_events (trigger_type, pre_avg_drift, blended_window_size)
     VALUES ($1, $2, $3)`,
    [row.triggerType, row.preAvgDrift, row.blendedWindowSize],
  );
}

export async function getRecentQueries(limit: number): Promise<QueryRecord[]> {
  const result = await pool.query(
    `SELECT id, text, label, confidence, drift_distance AS "driftDistance",
            is_drift_flagged AS "isDriftFlagged", created_at AS "createdAt"
     FROM queries
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit],
  );
  return result.rows.reverse();
}

export async function getQueryCount(): Promise<number> {
  const result = await pool.query(`SELECT COUNT(*)::int AS count FROM queries`);
  return result.rows[0].count;
}

export async function getLastReindexEvent(): Promise<ReindexEventRecord | null> {
  const result = await pool.query(
    `SELECT id, trigger_type AS "triggerType", pre_avg_drift AS "preAvgDrift",
            blended_window_size AS "blendedWindowSize", created_at AS "createdAt"
     FROM reindex_events
     ORDER BY created_at DESC
     LIMIT 1`,
  );
  return result.rows[0] ?? null;
}
