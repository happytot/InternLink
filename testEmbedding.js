import { generateEmbedding } from "./server/generateEmbedding.js";

(async () => {
  const text = "Hello world! This is a test embedding.";
  const embedding = await generateEmbedding(text);
  console.log("Embedding length:", embedding.length);
})();
