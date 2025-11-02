import sql from "@/app/lib/postgres_client";
import { generateEmbedding } from "./embeddings";

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  price_pence: number;
  category: string | null;
  seller_id: string;
  similarity: number;
  listing_image: string | null;
}

/**
 * Semantic search for listings using vector similarity
 * @param query - User's search query
 * @param limit - Maximum number of results to return
 * @param minSimilarity - Minimum similarity threshold (0-1)
 * @returns Array of matching listings sorted by similarity
 */
export async function searchListings(
  query: string,
  limit: number = 10,
  minSimilarity: number = 0.5
): Promise<SearchResult[]> {
  try {
    // Generate embedding for search query
    const queryEmbedding = await generateEmbedding(query);

    // Vector similarity search using cosine distance
    // Note: <=> is the cosine distance operator in pgvector
    // We convert to similarity by doing (1 - distance)
    const results = await sql`
      SELECT
        l.id,
        l.title,
        l.description,
        l.price_pence,
        l.category,
        l.seller_id,
        1 - (l.embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity,
        (
          SELECT li.url
          FROM listing_images li
          WHERE li.listing_id = l.id
          ORDER BY li.position
          LIMIT 1
        ) as listing_image
      FROM listings l
      WHERE
        l.status = 'active'
        AND l.embedding IS NOT NULL
        AND (1 - (l.embedding <=> ${JSON.stringify(queryEmbedding)}::vector)) >= ${minSimilarity}
      ORDER BY l.embedding <=> ${JSON.stringify(queryEmbedding)}::vector
      LIMIT ${limit}
    `;

    return results as unknown as SearchResult[];
  } catch (error) {
    console.error("Vector search failed:", error);
    throw new Error("Vector search failed");
  }
}

/**
 * Search listings by category with semantic search
 */
export async function searchListingsByCategory(
  query: string,
  category: string,
  limit: number = 10
): Promise<SearchResult[]> {
  try {
    const queryEmbedding = await generateEmbedding(query);

    const results = await sql`
      SELECT
        l.id,
        l.title,
        l.description,
        l.price_pence,
        l.category,
        l.seller_id,
        1 - (l.embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity,
        (
          SELECT li.url
          FROM listing_images li
          WHERE li.listing_id = l.id
          ORDER BY li.position
          LIMIT 1
        ) as listing_image
      FROM listings l
      WHERE
        l.status = 'active'
        AND l.embedding IS NOT NULL
        AND l.category = ${category}
      ORDER BY l.embedding <=> ${JSON.stringify(queryEmbedding)}::vector
      LIMIT ${limit}
    `;

    return results as unknown as SearchResult[];
  } catch (error) {
    console.error("Category search failed:", error);
    throw new Error("Category search failed");
  }
}
