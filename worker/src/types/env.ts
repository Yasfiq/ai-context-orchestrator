export interface Env {
  LLM_API_KEY: string;
  LLM_BASE_URL?: string;
  LLM_MODEL_NAME?: string;
  LLM_CHAT_MODEL_NAME?: string;
  LLM_DOCUMENT_MODEL_NAME?: string;
  LLM_TWEAK_MODEL_NAME?: string;
  ALLOWED_ORIGINS?: string;
  WORKER_SECRET?: string;
}
