import OpenAI from "openai";

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "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",
});

// Model constants
export const OPENAI_CHAT_MODEL = process.env.OPENAI_MODEL || "gpt-4-turbo-preview";
export const OPENAI_EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "text-embedding-3-large";
