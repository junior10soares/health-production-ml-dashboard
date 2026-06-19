CREATE TABLE IF NOT EXISTS queries (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  label TEXT NOT NULL,
  confidence REAL NOT NULL,
  drift_distance REAL NOT NULL,
  is_drift_flagged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reindex_events (
  id SERIAL PRIMARY KEY,
  trigger_type TEXT NOT NULL,
  pre_avg_drift REAL NOT NULL,
  blended_window_size INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_queries_created_at ON queries (created_at);
