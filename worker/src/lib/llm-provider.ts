import { createOpenAI } from "@ai-sdk/openai";
import type { Env } from "../types/env";

/**
 * Universal LLM Provider Configuration for Cloudflare Workers
 * Mendukung OpenAI, Groq, LiteLLM, LM Studio, Ollama, 9router, dll.
 */
export function getUniversalLLM(env: Env) {
  const apiKey = env.LLM_API_KEY;
  if (!apiKey) {
    throw new Error("LLM_API_KEY is not configured in worker environment");
  }
  const baseURL = env.LLM_BASE_URL || "https://api.openai.com/v1";

  return createOpenAI({
    apiKey,
    baseURL,
    compatibility: "compatible",
  });
}

export function getModelNames(env: Env) {
  const modelName = env.LLM_MODEL_NAME || "gpt-4o";
  return {
    modelName,
    chatModelName: env.LLM_CHAT_MODEL_NAME || modelName,
    documentModelName: env.LLM_DOCUMENT_MODEL_NAME || modelName,
    tweakModelName: env.LLM_TWEAK_MODEL_NAME || env.LLM_CHAT_MODEL_NAME || modelName,
  };
}
