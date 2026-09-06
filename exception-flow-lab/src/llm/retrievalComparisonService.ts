// src/llm/retrievalComparisonService.ts
//
// Mirrors llmSupportService.ts's shape: an interface first, a placeholder
// implementation that ships now, and a commented-out sketch of where a live
// call goes later.
//
// A live implementation would send the learner's free-text answer plus this
// question's predefined referenceAnswer/requiredConcepts/commonMisconceptions
// (see RetrievalQuestion in types/content.ts) to an LLM, and parse its reply
// into a RetrievalComparisonResult. The LLM only ever compares and explains —
// it must never invent correctness criteria or decide what the learner was
// supposed to learn independently. That's why every field it would reason
// over is already authored in content/retrievalQuestions.ts rather than left
// for the model to infer.

import type { RetrievalComparisonResult, RetrievalQuestion } from "../types/content";

export interface RetrievalComparisonService {
  compare(retrievalQuestion: RetrievalQuestion, learnerAnswer: string): Promise<RetrievalComparisonResult | undefined>;
}

// --- Placeholder for the prototype ---
// Never evaluates the learner's answer. Returns `undefined` so a caller can
// tell "not evaluated yet" apart from a real (if unhelpful) verdict —
// RetrievalPractice.tsx renders its static "AI-supported feedback
// placeholder" card whenever this resolves to `undefined`.
export const placeholderRetrievalComparisonService: RetrievalComparisonService = {
  async compare() {
    return undefined;
  },
};

// --- Where a live LLM-backed comparison goes later ---
// Replace the export below with a real implementation matching this same
// interface. IMPORTANT: never put an API key directly in frontend code
// shipped to users — see llmSupportService.ts's note on a spending-limited
// key vs. a minimal backend proxy.
//
// export const liveRetrievalComparisonService: RetrievalComparisonService = {
//   async compare(retrievalQuestion, learnerAnswer) {
//     const response = await fetch("https://api.anthropic.com/v1/messages", { ... });
//     // Parse the response into a RetrievalComparisonResult, comparing
//     // learnerAnswer only against retrievalQuestion.referenceAnswer /
//     // requiredConcepts / commonMisconceptions — never re-deriving them.
//   },
// };

export const retrievalComparisonService: RetrievalComparisonService = placeholderRetrievalComparisonService;
