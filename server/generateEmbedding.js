

import { env, pipeline } from "@xenova/transformers";

// Force WASM backend
env.backends = ["wasm"];
env.allowNodejs = false;

let embedder = null;

export async function generateEmbedding(text) {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }

  const output = await embedder(text, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(output.data);
}
