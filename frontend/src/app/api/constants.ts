import OpenAI from "openai";

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Model constants
export const OPENAI_CHAT_MODEL = process.env.OPENAI_MODEL || "gpt-4-turbo-preview";
export const OPENAI_EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "text-embedding-3-large";
