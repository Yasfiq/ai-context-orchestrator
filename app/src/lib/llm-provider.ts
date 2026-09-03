import { createOpenAI } from "@ai-sdk/openai";

/**
 * Universal LLM Provider Configuration
 * Mendukung semua provider yang compatible dengan format OpenAI API
 * (OpenAI, Groq, LiteLLM, LM Studio, Ollama, 9router, dll).
 */

const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error("LLM_API_KEY is not configured");
const baseURL = process.env.LLM_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
export const modelName = process.env.LLM_MODEL_NAME || "gpt-4o";
export const chatModelName = process.env.LLM_CHAT_MODEL_NAME || modelName;
export const documentModelName =
  process.env.LLM_DOCUMENT_MODEL_NAME || modelName;
export const tweakModelName =
  process.env.LLM_TWEAK_MODEL_NAME || chatModelName;

export const universalLLM = createOpenAI({
  apiKey: apiKey,
  baseURL: baseURL,
  compatibility: "compatible", // Gunakan 'compatible' agar tidak strict hanya untuk OpenAI asli
});
