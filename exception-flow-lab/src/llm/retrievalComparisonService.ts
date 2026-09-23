// src/llm/retrievalComparisonService.ts
//
// Mirrors llmSupportService.ts's shape: an interface first, a placeholder
// implementation used whenever Gemini isn't configured, and a live
// Gemini-backed implementation.
//
// The live implementation sends the learner's free-text answer plus this
// question's predefined referenceAnswer/requiredConcepts/commonMisconceptions
// (see RetrievalQuestion in types/content.ts) to Gemini, constrained to
// return JSON matching RetrievalComparisonResult. The LLM only ever compares
// and explains — it's explicitly told not to invent correctness criteria or
// decide what the learner was supposed to learn; every field it reasons over
// is already authored in content/retrievalQuestions.ts, never inferred. It
// never assigns a grade, score, or pass/fail verdict (build spec §12) — see
// RetrievalComparisonResult's own doc comment in types/content.ts.

import type { RetrievalComparisonResult, RetrievalQuestion } from "../types/content";
import { generateJson, isGeminiConfigured } from "./geminiClient";

// Distinguishes "nothing to show because no key is configured" (expected,
// silent, renders the existing placeholder card) from "a live request was
// actually attempted and failed" (build spec §13 — must surface a real
// error state, never look like the same thing as "AI feedback is off").
export type RetrievalCheckOutcome =
  | { status: "ok"; result: RetrievalComparisonResult }
  | { status: "unavailable" }
  | { status: "error" };

export interface RetrievalComparisonService {
  compare(retrievalQuestion: RetrievalQuestion, learnerAnswer: string): Promise<RetrievalCheckOutcome>;
}

// --- Placeholder for the prototype ---
// Never evaluates the learner's answer. Used whenever Gemini isn't
// configured — RetrievalPractice.tsx renders its static "AI-supported
// feedback placeholder" card for this status, same as before this was
// wired up to a real model.
export const placeholderRetrievalComparisonService: RetrievalComparisonService = {
  async compare() {
    return { status: "unavailable" };
  },
};

// --- Live Gemini-backed implementation ---
const RETRIEVAL_SYSTEM_INSTRUCTION = `You compare a learner's free-text explanation against predefined reference material for one retrieval-practice question in a Java exception-handling learning tool. You only ever compare and explain — you never invent what counts as correct and never decide what the learner was supposed to learn; that's fixed entirely by the reference material given to you. You never assign a grade, score, percentage, or overall pass/fail judgment — only classify each required concept individually and suggest one thing to improve.

Rules you must never break:
- "criteria" must contain exactly one entry per item in the given "requiredConcepts" list, in the same order, each with that concept copied verbatim and a "status" of "addressed" (clearly demonstrated), "partly_addressed" (gestured at but incomplete or vague), or "missing" (not present at all).
- Judge substance, not wording — the learner doesn't need to match the reference answer's phrasing, only demonstrate the same understanding.
- "potentialInaccuracies" contains only items copied verbatim from the given "commonMisconceptions" list that the learner's answer actually shows signs of (empty array if none apply) — never a paraphrase, never an item not in that list.
- "improvementSuggestion" is one short (1-2 sentence), concrete, formative suggestion for what to add or fix next — never a restatement of what was already addressed, never a score or grade in disguise ("7/10", "mostly correct", etc.).`;

const RETRIEVAL_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    criteria: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          concept: { type: "STRING" },
          status: { type: "STRING", enum: ["addressed", "partly_addressed", "missing"] },
        },
        required: ["concept", "status"],
      },
    },
    potentialInaccuracies: { type: "ARRAY", items: { type: "STRING" } },
    improvementSuggestion: { type: "STRING" },
  },
  required: ["criteria", "potentialInaccuracies", "improvementSuggestion"],
};

// Structured feedback should be short by design (a handful of short array
// items plus 1-2 sentences) — a lower cap than the AI Support panel's free
// prose, so a verbose response gets truncated rather than silently costing
// more than this feature needs.
const RETRIEVAL_MAX_OUTPUT_TOKENS = 400;

function buildRetrievalPrompt(question: RetrievalQuestion, learnerAnswer: string): string {
  return `Question posed to the learner: ${question.question}

Reference answer (never shown to the learner): ${question.referenceAnswer}

Required concepts the learner's answer should demonstrate:
${question.requiredConcepts.map((concept) => `- ${concept}`).join("\n")}

Common misconceptions to check for:
${question.commonMisconceptions.length > 0 ? question.commonMisconceptions.map((m) => `- ${m}`).join("\n") : "(none authored for this question)"}

Learner's answer:
"""
${learnerAnswer}
"""

Compare the learner's answer against the reference material above and return the JSON result.`;
}

export const liveRetrievalComparisonService: RetrievalComparisonService = {
  async compare(retrievalQuestion, learnerAnswer) {
    try {
      const result = await generateJson<RetrievalComparisonResult>(
        RETRIEVAL_SYSTEM_INSTRUCTION,
        buildRetrievalPrompt(retrievalQuestion, learnerAnswer),
        RETRIEVAL_RESPONSE_SCHEMA,
        RETRIEVAL_MAX_OUTPUT_TOKENS
      );
      return { status: "ok", result };
    } catch {
      // Timeout, network error, exhausted retries, an empty/safety-filtered/
      // token-truncated response, or malformed JSON all land here — every
      // one of them is "a live request was attempted and failed", which the
      // UI must show as a real, actionable error rather than silently
      // reusing the "not configured" placeholder.
      return { status: "error" };
    }
  },
};

export const retrievalComparisonService: RetrievalComparisonService = isGeminiConfigured()
  ? liveRetrievalComparisonService
  : placeholderRetrievalComparisonService;
