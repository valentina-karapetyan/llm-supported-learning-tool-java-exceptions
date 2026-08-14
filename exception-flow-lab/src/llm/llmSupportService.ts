// src/llm/llmSupportService.ts

import type { SupportType, LlmSupportResponse, Task } from "../types/content";

export interface LlmSupportService {
  getSupport(task: Task, supportType: SupportType): Promise<LlmSupportResponse>;
}

// --- Mock implementation for the prototype ---
// Reads directly from the task's authored supportContent — no network call,
// no latency, no cost. This is what ships in the first version.
export const mockLlmSupportService: LlmSupportService = {
  async getSupport(task, supportType) {
    return task.supportContent[supportType];
  },
};

// --- Where a live LLM API integration goes later ---
// Replace the export below with a real implementation matching this same
// interface. IMPORTANT: never put an API key directly in frontend code
// shipped to users; if a live integration is added, either (a) restrict the
// key's spending limit and accept the tradeoff for a non-public prototype
// deployment, or (b) add a minimal backend proxy that holds the key
// server-side. See the README's "Live LLM integration" section.
//
// export const liveLlmSupportService: LlmSupportService = {
//   async getSupport(task, supportType) {
//     const response = await fetch("https://api.anthropic.com/v1/messages", { ... });
//     // parse response into LlmSupportResponse shape
//   },
// };

export const llmSupportService: LlmSupportService = mockLlmSupportService;
