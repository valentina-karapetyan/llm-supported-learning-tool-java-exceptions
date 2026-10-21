/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Optional: enables the live Gemini-backed services in llmSupportService.ts
  // and retrievalComparisonService.ts. Leave unset to keep using the
  // mock/placeholder implementations. See README's "Live LLM API
  // integration" section.
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_GEMINI_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
