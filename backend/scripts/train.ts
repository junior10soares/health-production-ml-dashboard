import fs from "fs";
import path from "path";
import { embed } from "../src/ml/embeddings";
import { trainLogisticRegression } from "../src/ml/logisticRegression";

interface DatasetRow {
  text: string;
  label: 0 | 1;
}

function cosineDistance(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const similarity = dot / (Math.sqrt(normA) * Math.sqrt(normB));
  return 1 - similarity;
}

function meanVector(vectors: number[][]): number[] {
  const dim = vectors[0].length;
  const mean = new Array(dim).fill(0);
  for (const v of vectors) {
    for (let i = 0; i < dim; i++) mean[i] += v[i];
  }
  for (let i = 0; i < dim; i++) mean[i] /= vectors.length;
  return mean;
}

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function std(values: number[], avg: number): number {
  const variance = mean(values.map((v) => (v - avg) ** 2));
  return Math.sqrt(variance);
}

async function main() {
  const datasetPath = path.join(__dirname, "../data/sentiment-dataset.json");
  const dataset: DatasetRow[] = JSON.parse(fs.readFileSync(datasetPath, "utf-8"));
  console.log(`Loaded ${dataset.length} labeled rows`);

  console.log("Embedding training set...");
  const embeddings: number[][] = [];
  for (let i = 0; i < dataset.length; i++) {
    const vec = await embed(dataset[i].text);
    embeddings.push(vec);
    if ((i + 1) % 25 === 0 || i === dataset.length - 1) {
      console.log(`  embedded ${i + 1}/${dataset.length}`);
    }
  }

  const labels = dataset.map((row) => row.label);

  console.log("Training logistic regression...");
  const weights = trainLogisticRegression(embeddings, labels, {
    epochs: 300,
    learningRate: 0.5,
    l2: 0.001,
    onEpoch: (epoch, accuracy, loss) => {
      console.log(`  epoch ${epoch}: accuracy=${accuracy.toFixed(3)} loss=${loss.toFixed(4)}`);
    },
  });

  console.log("Computing reference drift statistics...");
  const centroid = meanVector(embeddings);
  const distances = embeddings.map((vec) => cosineDistance(vec, centroid));
  const distanceMean = mean(distances);
  const distanceStd = std(distances, distanceMean);

  const artifactsDir = path.join(__dirname, "../artifacts");
  fs.mkdirSync(artifactsDir, { recursive: true });

  fs.writeFileSync(
    path.join(artifactsDir, "model-weights.json"),
    JSON.stringify(weights, null, 2),
  );

  fs.writeFileSync(
    path.join(artifactsDir, "reference-stats.json"),
    JSON.stringify(
      {
        centroid,
        distanceMean,
        distanceStd,
        trainedAt: new Date().toISOString(),
        datasetSize: dataset.length,
      },
      null,
      2,
    ),
  );

  console.log("Artifacts written to backend/artifacts/");
  console.log(`distanceMean=${distanceMean.toFixed(4)} distanceStd=${distanceStd.toFixed(4)}`);
}

main().catch((err) => {
  console.error("Training failed:", err);
  process.exit(1);
});
