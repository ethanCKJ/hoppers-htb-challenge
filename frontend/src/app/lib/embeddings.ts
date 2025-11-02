import { openai, OPENAI_EMBEDDING_MODEL } from "@/app/api/constants";

/**
 * Generate embedding vector for text using OpenAI
 * @param text - The text to embed
 * @returns Array of numbers representing the embedding vector (1536 dimensions)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: OPENAI_EMBEDDING_MODEL,
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Failed to generate embedding:", error);
    throw new Error("Embedding generation failed");
  }
}

/**
 * Create searchable text from listing for embedding
 * Combines title, description, and category into optimized search text
 */
export function createListingSearchText(
  title: string,
  description: string,
  category?: string
): string {
  const parts = [
    `Title: ${title}`,
    `Description: ${description}`,
  ];

  if (category) {
    parts.push(`Category: ${category}`);
  }

  return parts.join("\n");
}

/**
 * Batch generate embeddings for multiple texts
 * Useful for bulk operations
 */
export async function generateEmbeddingsBatch(
  texts: string[]
): Promise<number[][]> {
  try {
    const response = await openai.embeddings.create({
      model: OPENAI_EMBEDDING_MODEL,
      input: texts,
    });

    return response.data.map((item) => item.embedding);
  } catch (error) {
    console.error("Failed to generate batch embeddings:", error);
    throw new Error("Batch embedding generation failed");
  }
}
