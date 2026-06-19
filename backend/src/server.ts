import "dotenv/config";
import express from "express";
import cors from "cors";
import { getEmbedder } from "./ml/embeddings";
import { runMigrations } from "./db/connection";
import { predictRouter } from "./routes/predict";
import { statsRouter } from "./routes/stats";
import { historyRouter } from "./routes/history";
import { reindexRouter } from "./routes/reindex";

const PORT = process.env.PORT ?? 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";

let isModelReady = false;

const app = express();
app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json());

app.get("/health", (_req, res) => {
  if (!isModelReady) {
    res.status(503).json({ status: "warming up" });
    return;
  }
  res.json({ status: "ok" });
});

app.use(predictRouter);
app.use(statsRouter);
app.use(historyRouter);
app.use(reindexRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "internal server error" });
});

async function main() {
  await runMigrations();

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT} (model warming up...)`);
  });

  await getEmbedder();
  isModelReady = true;
  console.log("Model ready.");
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
