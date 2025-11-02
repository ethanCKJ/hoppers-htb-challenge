import OpenAI from "openai";

// Debug: Check if API key is loaded
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ ERROR: OPENAI_API_KEY is not set in environment variables");
  console.error("Please check your .env file and restart the dev server");
}

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
console.log(process.env.OPENAI_API_KEY ? "✅ OpenAI API Key loaded" : "❌ OpenAI API Key not loaded")
// Model constants
export const OPENAI_CHAT_MODEL = process.env.OPENAI_MODEL || "gpt-4-turbo-preview";
export const OPENAI_EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "text-embedding-3-large";
