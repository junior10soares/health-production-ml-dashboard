import { pipeline, type FeatureExtractionPipeline } from "@xenova/transformers";

const MODEL_NAME = "Xenova/all-MiniLM-L6-v2";

let embedderPromise: Promise<FeatureExtractionPipeline> | null = null;

export function getEmbedder(): Promise<FeatureExtractionPipeline> {
  if (!embedderPromise) {
    embedderPromise = pipeline("feature-extraction", MODEL_NAME) as Promise<FeatureExtractionPipeline>;
  }
  return embedderPromise;
}

export async function embed(text: string): Promise<number[]> {
  const embedder = await getEmbedder();
  const output = await embedder(text, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}
